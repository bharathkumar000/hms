import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/patient_models.dart';
import 'auth_service.dart';

/// A live stream of typed rows with a manual refresh hook.
class LiveList<T> {
  final Stream<List<T>> stream;
  final Future<void> Function() refresh;
  final void Function() dispose;

  const LiveList({required this.stream, required this.refresh, required this.dispose});
}

/// Central data layer for the patient portal. Every table watcher is backed by
/// a Supabase Realtime channel (filtered by the signed-in patient) so changes
/// made on any other portal (reception, doctor, lab, canteen…) appear live.
/// If realtime is not enabled for a table it automatically falls back to
/// periodic polling.
class PatientService {
  PatientService._();

  static final PatientService instance = PatientService._();

  static SupabaseClient get _client => Supabase.instance.client;

  static String get _uid => AuthService.currentUserId ?? '';

  static const Duration _pollInterval = Duration(seconds: 15);

  static final List<void Function()> _cleanups = [];

  /// Releases every active realtime subscription. Call on logout.
  static void disposeAll() {
    for (final cleanup in _cleanups) {
      try {
        cleanup();
      } catch (_) {}
    }
    _cleanups.clear();
  }

  /// Creates a live watcher on [table].
  ///
  /// [select] is the PostgREST select string (may embed joined tables).
  /// When [eqColumn] is provided realtime changes are filtered server-side to
  /// `eqColumn = eqValue` (defaults to the current user id) and every refetch
  /// is constrained to that user's rows.
  static LiveList<Map<String, dynamic>> _watchRows(
    String table, {
    String select = '*',
    String? eqColumn,
    Object? eqValue,
    String orderColumn = 'created_at',
    bool descending = true,
    int? limit,
  }) {
    final controller =
        StreamController<List<Map<String, dynamic>>>.broadcast();
    Timer? poll;
    RealtimeChannel? channel;

    Future<void> fetch() async {
      try {
        dynamic q = _client.from(table).select(select);
        if (eqColumn != null) q = q.eq(eqColumn, eqValue ?? _uid);
        if (orderColumn.isNotEmpty) q = q.order(orderColumn, ascending: !descending);
        if (limit != null) q = q.limit(limit);
        final rows = await q as List<dynamic>;
        if (controller.isClosed) return;
        controller.add(rows.map(asMap).toList());
      } catch (_) {
        // Ignore transient fetch errors; the next poll / event retries.
      }
    }

    void startPolling() {
      poll ??= Timer.periodic(_pollInterval, (_) => fetch());
    }

    void subscribe() {
      try {
        final topicName = 'patient:${table}:$_uid';
        channel = _client.channel(topicName);
        PostgresChangeFilter? filter;
        if (eqColumn != null) {
          filter = PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: eqColumn,
            value: eqValue ?? _uid,
          );
        }
        channel!.onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: table,
          filter: filter,
          callback: (_) => fetch(),
        ).subscribe((status, _) {
          if (status != RealtimeSubscribeStatus.subscribed) {
            try {
              channel?.unsubscribe();
            } catch (_) {}
            startPolling();
          }
        });
      } catch (_) {
        startPolling();
      }
    }

    subscribe();
    fetch();

    final cleanup = () {
      controller.close();
      poll?.cancel();
      try {
        channel?.unsubscribe();
      } catch (_) {}
    };
    _cleanups.add(cleanup);

    return LiveList<Map<String, dynamic>>(
      stream: controller.stream,
      refresh: fetch,
      dispose: cleanup,
    );
  }

  static LiveList<T> _map<T>(
    LiveList<Map<String, dynamic>> source,
    T Function(Map<String, dynamic>) fromMap,
  ) {
    return LiveList<T>(
      stream: source.stream.map((rows) => rows.map(fromMap).toList()),
      refresh: source.refresh,
      dispose: source.dispose,
    );
  }

  // ---------------------------------------------------------------------------
  // Live watchers
  // ---------------------------------------------------------------------------

  static LiveList<PatientProfile> watchProfile() =>
      _map(_watchRows('profiles', eqColumn: 'id', orderColumn: ''), PatientProfile.fromMap);

  static LiveList<Appointment> watchAppointments() => _map(
        _watchRows(
          'appointments',
          select: '*, doctors(first_name, last_name, specialization)',
          eqColumn: 'patient_id',
          orderColumn: 'appointment_date',
        ),
        Appointment.fromMap,
      );

  static LiveList<QueueEntry> watchQueue() {
    final q = _watchRows(
      'patient_queue',
      select: '*, doctors(first_name, last_name)',
      eqColumn: 'patient_id',
      orderColumn: 'check_in_time',
    );
    return LiveList<QueueEntry>(
      stream: q.stream.map((rows) => rows
          .where((r) =>
              (r['status'] == 'Waiting' ||
                  r['status'] == 'In Consultation' ||
                  r['status'] == 'In Progress') &&
              _isToday(r['check_in_time']))
          .map(QueueEntry.fromMap)
          .toList()),
      refresh: q.refresh,
      dispose: q.dispose,
    );
  }

  static LiveList<MedicalRecord> watchMedicalRecords() => _map(
        _watchRows(
          'medical_records',
          select: '*, doctors(first_name, last_name, specialization), documents(*)',
          eqColumn: 'patient_id',
          orderColumn: 'record_date',
        ),
        MedicalRecord.fromMap,
      );

  static LiveList<Prescription> watchPrescriptions() => _map(
        _watchRows(
          'prescriptions',
          select: '*, doctors(first_name, last_name, specialization)',
          eqColumn: 'patient_id',
        ),
        Prescription.fromMap,
      );

  static LiveList<Bill> watchBills() => _map(
        _watchRows(
          'bills',
          select: '*, bill_items(*)',
          eqColumn: 'patient_id',
        ),
        Bill.fromMap,
      );

  static LiveList<LabOrder> watchLabOrders() => _map(
        _watchRows(
          'lab_orders',
          select: '*, doctors(first_name, last_name, specialization)',
          eqColumn: 'patient_id',
        ),
        LabOrder.fromMap,
      );

  static LiveList<HospitalNotification> watchNotifications() => _map(
        _watchRows('notifications', eqColumn: 'user_id'),
        HospitalNotification.fromMap,
      );

  static LiveList<Admission> watchAdmissions() => _map(
        _watchRows(
          'admissions',
          select:
              '*, doctors(first_name, last_name, specialization), beds(bed_number, rooms(room_number, wards(name, type))), bed_transfers(previous_beds(bed_number), new_beds(bed_number), transfer_date, reason)',
          eqColumn: 'patient_id',
          orderColumn: 'admission_date',
        ),
        Admission.fromMap,
      );

  static LiveList<Doctor> watchDoctors() => _map(
        _watchRows('doctors', orderColumn: 'first_name', descending: false),
        Doctor.fromMap,
      );

  static LiveList<CanteenCategory> watchCanteenCategories() => _map(
        _watchRows('food_categories', orderColumn: 'name', descending: false),
        CanteenCategory.fromMap,
      );

  static LiveList<MenuItem> watchMenuItems() => _map(
        _watchRows(
          'menu_items',
          select: '*, food_categories(name)',
          orderColumn: 'name',
          descending: false,
        ),
        MenuItem.fromMap,
      );

  static LiveList<CanteenOrder> watchCanteenOrders() => _map(
        _watchRows(
          'canteen_orders',
          select: '*, canteen_order_items(quantity, price_at_time, menu_items(name))',
          eqColumn: 'patient_id',
        ),
        CanteenOrder.fromMap,
      );

  // ---------------------------------------------------------------------------
  // One-shot fetches
  // ---------------------------------------------------------------------------

  static Future<PatientProfile?> fetchProfile() async {
    try {
      final row = await _client
          .from('profiles')
          .select('*')
          .eq('id', _uid)
          .maybeSingle();
      return row == null ? null : PatientProfile.fromMap(asMap(row));
    } on PostgrestException {
      return null;
    }
  }

  static Future<Admission?> fetchCurrentAdmission() async {
    try {
      final row = await _client
          .from('admissions')
          .select(
              '*, doctors(first_name, last_name, specialization), beds(bed_number, rooms(room_number, wards(name, type))), bed_transfers(previous_beds(bed_number), new_beds(bed_number), transfer_date, reason)')
          .eq('patient_id', _uid)
          .eq('status', 'Admitted')
          .order('admission_date', ascending: false)
          .maybeSingle();
      return row == null ? null : Admission.fromMap(asMap(row));
    } on PostgrestException {
      return null;
    }
  }

  static Future<Appointment?> fetchNextAppointment() async {
    try {
      final row = await _client
          .from('appointments')
          .select('*, doctors(first_name, last_name, specialization)')
          .eq('patient_id', _uid)
          .eq('status', 'Upcoming')
          .order('appointment_date')
          .order('appointment_time')
          .limit(1)
          .maybeSingle();
      return row == null ? null : Appointment.fromMap(asMap(row));
    } on PostgrestException {
      return null;
    }
  }

  static Future<LabOrder?> fetchLatestLabOrder() async {
    try {
      final row = await _client
          .from('lab_orders')
          .select('*, doctors(first_name, last_name, specialization)')
          .eq('patient_id', _uid)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();
      return row == null ? null : LabOrder.fromMap(asMap(row));
    } on PostgrestException {
      return null;
    }
  }

  static Future<double> fetchPendingBillsTotal() async {
    try {
      final bills =
          await _client.from('bills').select('total_amount, amount_paid, status').eq('patient_id', _uid);
      var total = 0.0;
      for (final b in bills) {
        final status = str(b['status']) ?? 'Pending';
        if (status == 'Pending' || status == 'Partially Paid') {
          total += (numVal(b['total_amount']) ?? 0) - (numVal(b['amount_paid']) ?? 0);
        }
      }
      return total;
    } on PostgrestException {
      return 0.0;
    }
  }

  static Future<List<Doctor>> fetchDoctors() async {
    try {
      final rows =
          await _client.from('doctors').select('*').order('first_name');
      return rows.map((e) => Doctor.fromMap(asMap(e))).toList();
    } on PostgrestException {
      return const [];
    }
  }

  static Future<int> fetchUnreadNotifications() async {
    try {
      final res = await _client
          .from('notifications')
          .select('id')
          .eq('user_id', _uid)
          .eq('is_read', false)
          .count(CountOption.exact);
      return res.count;
    } on PostgrestException {
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  /// Returns an error message on failure, otherwise null.
  static Future<String?> saveProfile(PatientProfile profile) async {
    try {
      await _client.from('profiles').upsert({'id': _uid, ...profile.toMap()});
      return null;
    } on PostgrestException catch (e) {
      return e.message;
    }
  }

  static Future<String?> bookAppointment({
    required String doctorId,
    required DateTime date,
    required String time,
    String? reason,
  }) async {
    try {
      final row = await _client
          .from('appointments')
          .insert({
            'patient_id': _uid,
            'doctor_id': doctorId,
            'appointment_date': date.toIso8601String().split('T').first,
            'appointment_time': time,
            'reason_for_visit': reason,
            'status': 'Upcoming',
          })
          .select('id')
          .single();
      await addChargeToPatient(
        itemName: 'General Consultation',
        itemType: 'Consultation',
        unitPrice: 500,
        appointmentId: row['id'] as String?,
      );
      return null;
    } on PostgrestException catch (e) {
      return e.message;
    }
  }

  static Future<String?> rescheduleAppointment({
    required String appointmentId,
    required String doctorId,
    required DateTime date,
    required String time,
    String? reason,
  }) async {
    try {
      await _client
          .from('appointments')
          .update({
            'doctor_id': doctorId,
            'appointment_date': date.toIso8601String().split('T').first,
            'appointment_time': time,
            'reason_for_visit': reason,
          })
          .eq('id', appointmentId);
      return null;
    } on PostgrestException catch (e) {
      return e.message;
    }
  }

  static Future<void> cancelAppointment(String appointmentId) async {
    try {
      await _client
          .from('appointments')
          .update({'status': 'Cancelled'})
          .eq('id', appointmentId);
    } on PostgrestException {
      // Surface via the realtime stream if the UI is still open.
    }
  }

  /// Mirrors the web portal's `addChargeToPatient` billing automation.
  static Future<void> addChargeToPatient({
    required String itemName,
    required String itemType,
    required double unitPrice,
    String? appointmentId,
    int quantity = 1,
  }) async {
    try {
      final amount = unitPrice * quantity;

      String billId;
      final existing = await _client
          .from('bills')
          .select('id')
          .eq('patient_id', _uid)
          .eq('status', 'Pending')
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (existing != null) {
        billId = existing['id'] as String;
      } else {
        final newBill = await _client
            .from('bills')
            .insert({
              'patient_id': _uid,
              'appointment_id': appointmentId,
              'status': 'Pending',
              'bill_type': 'General',
              'total_amount': 0,
              'amount_paid': 0,
            })
            .select('id')
            .single();
        billId = newBill['id'] as String;
      }

      await _client.from('bill_items').insert({
        'bill_id': billId,
        'item_name': itemName,
        'item_type': itemType,
        'quantity': quantity,
        'unit_price': unitPrice,
        'amount': amount,
      });

      final totals =
          await _client.from('bill_items').select('amount').eq('bill_id', billId);
      final sum = totals.fold(0.0, (total, e) => total + (numVal(e['amount']) ?? 0));
      await _client.from('bills').update({'total_amount': sum}).eq('id', billId);
    } on PostgrestException {
      // Billing automation failure should not block the booking itself.
    }
  }

  static Future<void> markAllNotificationsRead() async {
    try {
      await _client
          .from('notifications')
          .update({'is_read': true})
          .eq('user_id', _uid)
          .eq('is_read', false);
    } on PostgrestException {
      // Ignore; the stream will pick up fresh data.
    }
  }

  static Future<String?> placeCanteenOrder({
    required List<Map<String, dynamic>> items,
    required double totalAmount,
    required String deliveryLocation,
    String? admissionId,
    String? specialInstructions,
  }) async {
    try {
      final order = await _client
          .from('canteen_orders')
          .insert({
            'patient_id': _uid,
            'admission_id': admissionId,
            'total_amount': totalAmount,
            'delivery_location': deliveryLocation,
            'special_instructions': specialInstructions,
            'status': 'Pending',
          })
          .select('id')
          .single();

      final orderItems = items
          .map((i) => {
                'order_id': order['id'],
                'menu_item_id': i['menu_item_id'],
                'quantity': i['quantity'],
                'price_at_time': i['price_at_time'],
              })
          .toList();

      await _client.from('canteen_order_items').insert(orderItems);
      return null;
    } on PostgrestException catch (e) {
      return e.message;
    }
  }

  static bool _isToday(dynamic v) {
    final dt = dateTimeVal(v);
    if (dt == null) return false;
    final now = DateTime.now();
    return dt.year == now.year && dt.month == now.month && dt.day == now.day;
  }
}