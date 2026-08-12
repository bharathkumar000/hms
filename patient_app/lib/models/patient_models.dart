import 'package:intl/intl.dart';

/// Simple map helpers used across all models.
Map<String, dynamic> asMap(dynamic v) =>
    v is Map<String, dynamic> ? v : (v is Map ? Map<String, dynamic>.from(v) : const {});

String? str(dynamic v) => v == null ? null : v.toString();

double? numVal(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse(v.toString()));

DateTime? dateTimeVal(dynamic v) {
  if (v == null) return null;
  if (v is DateTime) return v;
  if (v is String) return DateTime.tryParse(v);
  return null;
}

DateTime? dateVal(dynamic v) {
  final dt = dateTimeVal(v);
  if (dt == null) return null;
  return DateTime(dt.year, dt.month, dt.day);
}

String formatDate(DateTime? d) => d == null ? '—' : DateFormat('dd MMM yyyy').format(d);

String formatDateTime(DateTime? d) =>
    d == null ? '—' : DateFormat('dd MMM yyyy, hh:mm a').format(d.toLocal());

/// Formats `HH:mm:ss` time strings to `hh:mm a`.
String formatTime(String? t) {
  if (t == null || t.isEmpty) return '—';
  final parts = t.split(':');
  if (parts.length < 2) return t;
  final h = int.tryParse(parts[0]) ?? 0;
  final m = parts[1].padLeft(2, '0');
  final period = h >= 12 ? 'PM' : 'AM';
  final hh = h % 12 == 0 ? 12 : h % 12;
  return '$hh:$m $period';
}

String money(num? v) =>
    v == null ? '—' : '\u20B9${v.toStringAsFixed(2)}';

class PatientProfile {
  final String id;
  final String? firstName;
  final String? lastName;
  final DateTime? dateOfBirth;
  final String? gender;
  final String? phoneNumber;
  final String? address;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? bloodGroup;
  final String? insuranceProvider;
  final String? insurancePolicyNumber;
  final String? profilePictureUrl;

  const PatientProfile({
    required this.id,
    this.firstName,
    this.lastName,
    this.dateOfBirth,
    this.gender,
    this.phoneNumber,
    this.address,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.bloodGroup,
    this.insuranceProvider,
    this.insurancePolicyNumber,
    this.profilePictureUrl,
  });

  String get fullName {
    final names = [firstName, lastName].where((e) => e != null && e.trim().isNotEmpty);
    return names.isEmpty ? 'Patient' : names.join(' ');
  }

  String get initials {
    final parts = [firstName, lastName].where((e) => e != null && e.trim().isNotEmpty);
    if (parts.isEmpty) return 'P';
    final letters = parts.map((e) => e![0]).take(2).join().toUpperCase();
    return letters;
  }

  factory PatientProfile.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return PatientProfile(
      id: str(m['id']) ?? '',
      firstName: str(m['first_name']),
      lastName: str(m['last_name']),
      dateOfBirth: dateVal(m['date_of_birth']),
      gender: str(m['gender']),
      phoneNumber: str(m['phone_number']),
      address: str(m['address']),
      emergencyContactName: str(m['emergency_contact_name']),
      emergencyContactPhone: str(m['emergency_contact_phone']),
      bloodGroup: str(m['blood_group']),
      insuranceProvider: str(m['insurance_provider']),
      insurancePolicyNumber: str(m['insurance_policy_number']),
      profilePictureUrl: str(m['profile_picture_url']),
    );
  }

  Map<String, dynamic> toMap() => {
        if (firstName != null) 'first_name': firstName,
        if (lastName != null) 'last_name': lastName,
        if (dateOfBirth != null)
          'date_of_birth': DateFormat('yyyy-MM-dd').format(dateOfBirth!),
        if (gender != null) 'gender': gender,
        if (phoneNumber != null) 'phone_number': phoneNumber,
        if (address != null) 'address': address,
        if (emergencyContactName != null)
          'emergency_contact_name': emergencyContactName,
        if (emergencyContactPhone != null)
          'emergency_contact_phone': emergencyContactPhone,
        if (bloodGroup != null) 'blood_group': bloodGroup,
        if (insuranceProvider != null) 'insurance_provider': insuranceProvider,
        if (insurancePolicyNumber != null)
          'insurance_policy_number': insurancePolicyNumber,
        if (profilePictureUrl != null) 'profile_picture_url': profilePictureUrl,
      };
}

class Doctor {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? specialization;
  final String? department;
  final String? phoneNumber;
  final String? email;

  const Doctor({
    required this.id,
    this.firstName,
    this.lastName,
    this.specialization,
    this.department,
    this.phoneNumber,
    this.email,
  });

  String get fullName =>
      'Dr. ${[firstName, lastName].where((e) => e != null && e.trim().isNotEmpty).join(' ')}';

  factory Doctor.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return Doctor(
      id: str(m['id']) ?? '',
      firstName: str(m['first_name']),
      lastName: str(m['last_name']),
      specialization: str(m['specialization']),
      department: str(m['department']),
      phoneNumber: str(m['phone_number']),
      email: str(m['email']),
    );
  }
}

class Appointment {
  final String id;
  final String? patientId;
  final String? doctorId;
  final DateTime? date;
  final String? time;
  final String? status;
  final String? reasonForVisit;
  final String? notes;
  final Doctor? doctor;

  const Appointment({
    required this.id,
    this.patientId,
    this.doctorId,
    this.date,
    this.time,
    this.status,
    this.reasonForVisit,
    this.notes,
    this.doctor,
  });

  bool get isUpcoming => status == 'Upcoming';

  bool get isUpcomingInPast => isUpcoming && date != null && date!.isBefore(DateTime.now());

  factory Appointment.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return Appointment(
      id: str(m['id']) ?? '',
      patientId: str(m['patient_id']),
      doctorId: str(m['doctor_id']),
      date: dateVal(m['appointment_date']),
      time: str(m['appointment_time']),
      status: str(m['status']) ?? 'Upcoming',
      reasonForVisit: str(m['reason_for_visit']),
      notes: str(m['notes']),
      doctor: m['doctors'] != null ? Doctor.fromMap(asMap(m['doctors'])) : null,
    );
  }
}

class QueueEntry {
  final String id;
  final String? tokenNumber;
  final String? status;
  final DateTime? checkInTime;
  final Doctor? doctor;

  const QueueEntry({
    required this.id,
    this.tokenNumber,
    this.status,
    this.checkInTime,
    this.doctor,
  });

  factory QueueEntry.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return QueueEntry(
      id: str(m['id']) ?? '',
      tokenNumber: str(m['token_number']),
      status: str(m['status']) ?? 'Waiting',
      checkInTime: dateTimeVal(m['check_in_time']),
      doctor: m['doctors'] != null ? Doctor.fromMap(asMap(m['doctors'])) : null,
    );
  }
}

class MedicalRecord {
  final String id;
  final String? patientId;
  final String? doctorId;
  final String? diagnosis;
  final String? doctorNotes;
  final DateTime? recordDate;
  final Doctor? doctor;
  final List<DocumentItem> documents;

  const MedicalRecord({
    required this.id,
    this.patientId,
    this.doctorId,
    this.diagnosis,
    this.doctorNotes,
    this.recordDate,
    this.doctor,
    this.documents = const [],
  });

  factory MedicalRecord.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return MedicalRecord(
      id: str(m['id']) ?? '',
      patientId: str(m['patient_id']),
      doctorId: str(m['doctor_id']),
      diagnosis: str(m['diagnosis']),
      doctorNotes: str(m['doctor_notes']),
      recordDate: dateVal(m['record_date']),
      doctor: m['doctors'] != null ? Doctor.fromMap(asMap(m['doctors'])) : null,
      documents: _parseList(m['documents']).map(DocumentItem.fromMap).toList(),
    );
  }
}

class DocumentItem {
  final String id;
  final String? recordId;
  final String? documentType;
  final String? documentUrl;
  final String? title;
  final DateTime? uploadedAt;

  const DocumentItem({
    required this.id,
    this.recordId,
    this.documentType,
    this.documentUrl,
    this.title,
    this.uploadedAt,
  });

  factory DocumentItem.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return DocumentItem(
      id: str(m['id']) ?? '',
      recordId: str(m['record_id']),
      documentType: str(m['document_type']),
      documentUrl: str(m['document_url']),
      title: str(m['title']),
      uploadedAt: dateTimeVal(m['uploaded_at']),
    );
  }
}

class Prescription {
  final String id;
  final String? medicineName;
  final String? dosage;
  final String? frequency;
  final String? duration;
  final String? status;
  final String? dispenseStatus;
  final DateTime? createdAt;
  final Doctor? doctor;

  const Prescription({
    required this.id,
    this.medicineName,
    this.dosage,
    this.frequency,
    this.duration,
    this.status,
    this.dispenseStatus,
    this.createdAt,
    this.doctor,
  });

  bool get isActive =>
      status == 'Active' && dispenseStatus != 'Completed';

  factory Prescription.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return Prescription(
      id: str(m['id']) ?? '',
      medicineName: str(m['medicine_name']),
      dosage: str(m['dosage']),
      frequency: str(m['frequency']),
      duration: str(m['duration']),
      status: str(m['status']) ?? 'Active',
      dispenseStatus: str(m['dispense_status']) ?? 'Pending',
      createdAt: dateTimeVal(m['created_at']),
      doctor: m['doctors'] != null ? Doctor.fromMap(asMap(m['doctors'])) : null,
    );
  }
}

class Bill {
  final String id;
  final String? patientId;
  final String? appointmentId;
  final double? amount;
  final double? subtotal;
  final double? tax;
  final double? discount;
  final double? totalAmount;
  final double? amountPaid;
  final String? description;
  final String? billType;
  final String? status;
  final DateTime? dueDate;
  final String? invoiceNumber;
  final String? invoiceUrl;
  final DateTime? createdAt;
  final List<BillItem> items;

  const Bill({
    required this.id,
    this.patientId,
    this.appointmentId,
    this.amount,
    this.subtotal,
    this.tax,
    this.discount,
    this.totalAmount,
    this.amountPaid,
    this.description,
    this.billType,
    this.status,
    this.dueDate,
    this.invoiceNumber,
    this.invoiceUrl,
    this.createdAt,
    this.items = const [],
  });

  double get outstanding =>
      (totalAmount ?? 0) - (amountPaid ?? 0);

  factory Bill.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return Bill(
      id: str(m['id']) ?? '',
      patientId: str(m['patient_id']),
      appointmentId: str(m['appointment_id']),
      amount: numVal(m['amount']),
      subtotal: numVal(m['subtotal']),
      tax: numVal(m['tax']),
      discount: numVal(m['discount']),
      totalAmount: numVal(m['total_amount']),
      amountPaid: numVal(m['amount_paid']),
      description: str(m['description']),
      billType: str(m['bill_type']),
      status: str(m['status']) ?? 'Pending',
      dueDate: dateVal(m['due_date']),
      invoiceNumber: str(m['invoice_number']),
      invoiceUrl: str(m['invoice_url']),
      createdAt: dateTimeVal(m['created_at']),
      items: _parseList(m['bill_items']).map(BillItem.fromMap).toList(),
    );
  }
}

class BillItem {
  final String id;
  final String? billId;
  final String? itemName;
  final String? itemType;
  final int quantity;
  final double? unitPrice;
  final double? amount;

  const BillItem({
    required this.id,
    this.billId,
    this.itemName,
    this.itemType,
    this.quantity = 1,
    this.unitPrice,
    this.amount,
  });

  factory BillItem.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return BillItem(
      id: str(m['id']) ?? '',
      billId: str(m['bill_id']),
      itemName: str(m['item_name']) ?? str(m['description']),
      itemType: str(m['item_type']),
      quantity: (m['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: numVal(m['unit_price']),
      amount: numVal(m['amount']),
    );
  }
}

class LabOrder {
  final String id;
  final String? testCategory;
  final String? notes;
  final String? sampleId;
  final DateTime? collectionTime;
  final DateTime? completionTime;
  final String? reportUrl;
  final String? reportStatus;
  final bool urgent;
  final String? status;
  final DateTime? createdAt;
  final Doctor? doctor;

  const LabOrder({
    required this.id,
    this.testCategory,
    this.notes,
    this.sampleId,
    this.collectionTime,
    this.completionTime,
    this.reportUrl,
    this.reportStatus,
    this.urgent = false,
    this.status,
    this.createdAt,
    this.doctor,
  });

  bool get isAvailable => status == 'Completed' || reportStatus == 'Released';
  bool get hasReport => reportUrl != null && reportUrl!.isNotEmpty;

  factory LabOrder.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return LabOrder(
      id: str(m['id']) ?? '',
      testCategory: str(m['test_category']),
      notes: str(m['notes']),
      sampleId: str(m['sample_id']),
      collectionTime: dateTimeVal(m['collection_time']),
      completionTime: dateTimeVal(m['completion_time']),
      reportUrl: str(m['report_url']),
      reportStatus: str(m['report_status']),
      urgent: (m['urgent'] as bool?) ?? false,
      status: str(m['status']) ?? 'Pending',
      createdAt: dateTimeVal(m['created_at']),
      doctor: m['doctors'] != null ? Doctor.fromMap(asMap(m['doctors'])) : null,
    );
  }
}

class HospitalNotification {
  final String id;
  final String? userId;
  final String? title;
  final String? message;
  final String? type;
  final bool isRead;
  final DateTime? createdAt;

  const HospitalNotification({
    required this.id,
    this.userId,
    this.title,
    this.message,
    this.type,
    this.isRead = false,
    this.createdAt,
  });

  factory HospitalNotification.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return HospitalNotification(
      id: str(m['id']) ?? '',
      userId: str(m['user_id']),
      title: str(m['title']),
      message: str(m['message']),
      type: str(m['type']),
      isRead: (m['is_read'] as bool?) ?? false,
      createdAt: dateTimeVal(m['created_at']),
    );
  }
}

class Admission {
  final String id;
  final String? patientId;
  final String? doctorId;
  final String? headNurseName;
  final String? bedId;
  final DateTime? admissionDate;
  final DateTime? expectedDischargeDate;
  final DateTime? actualDischargeDate;
  final String? status;
  final String? reasonForAdmission;
  final Doctor? doctor;
  final String? wardName;
  final String? wardType;
  final String? roomNumber;
  final String? bedNumber;
  final List<BedTransfer> transfers;

  const Admission({
    required this.id,
    this.patientId,
    this.doctorId,
    this.headNurseName,
    this.bedId,
    this.admissionDate,
    this.expectedDischargeDate,
    this.actualDischargeDate,
    this.status,
    this.reasonForAdmission,
    this.doctor,
    this.wardName,
    this.wardType,
    this.roomNumber,
    this.bedNumber,
    this.transfers = const [],
  });

  bool get isAdmitted => status == 'Admitted';

  String get location => [wardName, roomNumber, bedNumber]
      .where((e) => e != null && e.trim().isNotEmpty)
      .join(', ');

  factory Admission.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    Map<String, dynamic>? bedMap;
    if (m['beds'] != null) {
      bedMap = asMap(m['beds']);
      if (bedMap['rooms'] != null) {
        final roomMap = asMap(bedMap['rooms']);
        if (roomMap['wards'] != null) {
          bedMap['_ward_name'] = str(asMap(roomMap['wards'])['name']);
          bedMap['_ward_type'] = str(asMap(roomMap['wards'])['type']);
        }
        bedMap['_room_number'] = str(roomMap['room_number']);
      }
    }
    return Admission(
      id: str(m['id']) ?? '',
      patientId: str(m['patient_id']),
      doctorId: str(m['assigned_doctor_id']),
      headNurseName: str(m['head_nurse_name']),
      bedId: str(m['bed_id']),
      admissionDate: dateTimeVal(m['admission_date']),
      expectedDischargeDate: dateTimeVal(m['expected_discharge_date']),
      actualDischargeDate: dateTimeVal(m['actual_discharge_date']),
      status: str(m['status']) ?? 'Admitted',
      reasonForAdmission: str(m['reason_for_admission']),
      doctor: m['doctors'] != null ? Doctor.fromMap(asMap(m['doctors'])) : null,
      wardName: bedMap?['_ward_name'],
      wardType: bedMap?['_ward_type'],
      roomNumber: bedMap?['_room_number'],
      bedNumber: str(bedMap?['bed_number']),
      transfers: _parseList(m['bed_transfers']).map(BedTransfer.fromMap).toList(),
    );
  }
}

class BedTransfer {
  final String id;
  final String? previousBedNumber;
  final String? newBedNumber;
  final DateTime? transferDate;
  final String? reason;

  const BedTransfer({
    required this.id,
    this.previousBedNumber,
    this.newBedNumber,
    this.transferDate,
    this.reason,
  });

  factory BedTransfer.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return BedTransfer(
      id: str(m['id']) ?? '',
      previousBedNumber: str(m['previous_bed_number']) ??
          (m['previous_beds'] != null
              ? str(asMap(m['previous_beds'])['bed_number'])
              : null),
      newBedNumber: str(m['new_bed_number']) ??
          (m['new_beds'] != null ? str(asMap(m['new_beds'])['bed_number']) : null),
      transferDate: dateTimeVal(m['transfer_date']),
      reason: str(m['reason']),
    );
  }
}

class CanteenCategory {
  final String id;
  final String? name;

  const CanteenCategory({required this.id, this.name});

  factory CanteenCategory.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return CanteenCategory(id: str(m['id']) ?? '', name: str(m['name']));
  }
}

class MenuItem {
  final String id;
  final String? categoryId;
  final String? name;
  final String? description;
  final double? price;
  final bool isAvailable;
  final String? imageUrl;
  final String? categoryName;

  const MenuItem({
    required this.id,
    this.categoryId,
    this.name,
    this.description,
    this.price,
    this.isAvailable = true,
    this.imageUrl,
    this.categoryName,
  });

  factory MenuItem.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return MenuItem(
      id: str(m['id']) ?? '',
      categoryId: str(m['category_id']),
      name: str(m['name']),
      description: str(m['description']),
      price: numVal(m['price']),
      isAvailable: (m['is_available'] as bool?) ?? true,
      imageUrl: str(m['image_url']),
      categoryName: m['food_categories'] != null
          ? str(asMap(m['food_categories'])['name'])
          : null,
    );
  }
}

class CanteenOrder {
  final String id;
  final String? admissionId;
  final double? totalAmount;
  final String? status;
  final String? deliveryLocation;
  final String? specialInstructions;
  final DateTime? createdAt;
  final List<CanteenOrderItem> items;

  const CanteenOrder({
    required this.id,
    this.admissionId,
    this.totalAmount,
    this.status,
    this.deliveryLocation,
    this.specialInstructions,
    this.createdAt,
    this.items = const [],
  });

  factory CanteenOrder.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return CanteenOrder(
      id: str(m['id']) ?? '',
      admissionId: str(m['admission_id']),
      totalAmount: numVal(m['total_amount']),
      status: str(m['status']) ?? 'Pending',
      deliveryLocation: str(m['delivery_location']),
      specialInstructions: str(m['special_instructions']),
      createdAt: dateTimeVal(m['created_at']),
      items: _parseList(m['canteen_order_items'])
          .map(CanteenOrderItem.fromMap)
          .toList(),
    );
  }
}

class CanteenOrderItem {
  final String id;
  final String? menuItemId;
  final int quantity;
  final double? priceAtTime;
  final String? menuItemName;

  const CanteenOrderItem({
    required this.id,
    this.menuItemId,
    this.quantity = 1,
    this.priceAtTime,
    this.menuItemName,
  });

  factory CanteenOrderItem.fromMap(Map<String, dynamic> map) {
    final m = asMap(map);
    return CanteenOrderItem(
      id: str(m['id']) ?? '',
      menuItemId: str(m['menu_item_id']),
      quantity: (m['quantity'] as num?)?.toInt() ?? 1,
      priceAtTime: numVal(m['price_at_time']),
      menuItemName: m['menu_items'] != null
          ? str(asMap(m['menu_items'])['name'])
          : null,
    );
  }
}

List<Map<String, dynamic>> _parseList(dynamic v) {
  if (v == null) return const [];
  if (v is List) return v.map(asMap).toList();
  return const [];
}