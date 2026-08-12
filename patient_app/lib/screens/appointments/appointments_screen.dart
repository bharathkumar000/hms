import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  late LiveList<Appointment> _appointments;
  late LiveList<QueueEntry> _queue;
  late LiveList<Doctor> _doctors;

  @override
  void initState() {
    super.initState();
    _appointments = PatientService.watchAppointments();
    _queue = PatientService.watchQueue();
    _doctors = PatientService.watchDoctors();
  }

  @override
  void dispose() {
    _appointments.dispose();
    _queue.dispose();
    _doctors.dispose();
    super.dispose();
  }

  Future<void> _openBookingSheet({Appointment? reschedule}) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AppointmentFormSheet(
        doctorsLive: _doctors,
        reschedule: reschedule,
      ),
    );
  }

  Future<void> _confirmCancel(Appointment apt) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Cancel Appointment', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        content: Text(
          'Cancel your appointment with ${apt.doctor?.fullName ?? 'doctor'} on ${formatDate(apt.date)}?',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Keep'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Cancel Appointment',
              style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await PatientService.cancelAppointment(apt.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Appointment cancelled')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'My Appointments',
                        style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                      ),
                      Text(
                        'Live view · updates in real time',
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _openBookingSheet(),
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Book'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: LiveView<Appointment>(
              live: _appointments,
              builder: (context, appointments) {
                return ListView(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  children: [
                    _buildQueueCard(),
                    const SizedBox(height: 20),
                    const SectionHeader('Appointments'),
                    const SizedBox(height: 12),
                    if (appointments.isEmpty)
                      const EmptyState(
                        'No appointments found',
                        icon: Icons.event_busy_rounded,
                        subtitle: 'Tap Book to schedule a consultation with a doctor.',
                      )
                    else
                      ...appointments.map((apt) => _buildAppointmentCard(apt)).toList(),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQueueCard() {
    return StreamBuilder<List<QueueEntry>>(
      stream: _queue.stream,
      builder: (context, snapshot) {
        final queue = snapshot.data ?? const <QueueEntry>[];
        if (queue.isEmpty) return const SizedBox.shrink();
        final entry = queue.first;
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.timer_rounded, color: Color(0xFFB45309), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Live Queue Status',
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFFB45309)),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _queueItem('Doctor', entry.doctor?.fullName ?? '—'),
                  ),
                  Expanded(
                    child: _queueItem('Token', entry.tokenNumber ?? '—'),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Status',
                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF92400E)),
                        ),
                        const SizedBox(height: 4),
                        StatusChip(entry.status ?? 'Waiting'),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _queueItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF92400E)),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
        ),
      ],
    );
  }

  Widget _buildAppointmentCard(Appointment apt) {
    final doctor = apt.doctor;
    final isUpcoming = apt.isUpcoming;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 46,
                width: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.person_rounded, color: Color(0xFF2563EB), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor?.fullName ?? 'Your Doctor',
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      doctor?.specialization ?? 'General',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.event_rounded, size: 14, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Text(
                          formatDate(apt.date),
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                        ),
                        const SizedBox(width: 10),
                        const Icon(Icons.schedule_rounded, size: 14, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 4),
                        Text(
                          formatTime(apt.time),
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              StatusChip(apt.status ?? 'Upcoming'),
            ],
          ),
          if (apt.reasonForVisit != null && apt.reasonForVisit!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              'Reason: ${apt.reasonForVisit}',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
            ),
          ],
          if (isUpcoming) ...[
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _openBookingSheet(reschedule: apt),
                    icon: const Icon(Icons.edit_calendar_rounded, size: 16),
                    label: const Text('Reschedule'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF2563EB),
                      side: const BorderSide(color: Color(0xFF2563EB)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _confirmCancel(apt),
                    icon: const Icon(Icons.close_rounded, size: 16),
                    label: const Text('Cancel'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFEF4444),
                      side: const BorderSide(color: Color(0xFFEF4444)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _AppointmentFormSheet extends StatefulWidget {
  final LiveList<Doctor> doctorsLive;
  final Appointment? reschedule;

  const _AppointmentFormSheet({required this.doctorsLive, this.reschedule});

  @override
  State<_AppointmentFormSheet> createState() => _AppointmentFormSheetState();
}

class _AppointmentFormSheetState extends State<_AppointmentFormSheet> {
  final _reasonController = TextEditingController();
  String? _doctorId;
  DateTime? _date;
  TimeOfDay? _time;
  bool _submitting = false;
  String? _error;

  bool get _isReschedule => widget.reschedule != null;

  @override
  void initState() {
    super.initState();
    final apt = widget.reschedule;
    if (apt != null) {
      _doctorId = apt.doctorId;
      _date = apt.date;
      _time = apt.time != null ? _parseTime(apt.time!) : null;
      _reasonController.text = apt.reasonForVisit ?? '';
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  TimeOfDay? _parseTime(String time) {
    final parts = time.split(':');
    if (parts.length < 2) return null;
    return TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1]));
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _time ?? const TimeOfDay(hour: 9, minute: 0),
    );
    if (picked != null) setState(() => _time = picked);
  }

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  Future<void> _submit() async {
    if (_doctorId == null || _date == null || _time == null) {
      setState(() => _error = 'Please select a doctor, date and time.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });

    final time = _formatTime(_time!);
    final String? err;
    if (_isReschedule) {
      err = await PatientService.rescheduleAppointment(
        appointmentId: widget.reschedule!.id,
        doctorId: _doctorId!,
        date: _date!,
        time: time,
        reason: _reasonController.text.trim(),
      );
    } else {
      err = await PatientService.bookAppointment(
        doctorId: _doctorId!,
        date: _date!,
        time: time,
        reason: _reasonController.text.trim(),
      );
    }

    if (!mounted) return;
    if (err != null) {
      setState(() {
        _submitting = false;
        _error = err;
      });
      return;
    }

    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(_isReschedule ? 'Appointment rescheduled' : 'Appointment booked')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.of(context).viewInsets;
    return Container(
      padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + padding.bottom),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                height: 4,
                width: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _isReschedule ? 'Reschedule Appointment' : 'Book Appointment',
              style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 20),
            _buildDoctorField(),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildDateField(),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTimeField(),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _reasonController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Reason for visit (optional)',
                hintText: 'Describe your symptoms',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFFEF4444)),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                      )
                    : Text(_isReschedule ? 'Save Changes' : 'Book Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDoctorField() {
    return StreamBuilder<List<Doctor>>(
      stream: widget.doctorsLive.stream,
      builder: (context, snapshot) {
        final doctors = snapshot.data ?? const <Doctor>[];
        return DropdownButtonFormField<String>(
          initialValue: _doctorId,
          decoration: const InputDecoration(labelText: 'Select Doctor'),
          items: doctors
              .map((d) => DropdownMenuItem(
                    value: d.id,
                    child: Text(
                      '${d.fullName} · ${d.specialization ?? 'General'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 14),
                    ),
                  ))
              .toList(),
          onChanged: (v) => setState(() => _doctorId = v),
        );
      },
    );
  }

  Widget _buildDateField() {
    return InkWell(
      onTap: _pickDate,
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: const InputDecoration(labelText: 'Date'),
        child: Text(
          _date == null ? 'Select' : DateFormat('dd MMM yyyy').format(_date!),
          style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF1E293B)),
        ),
      ),
    );
  }

  Widget _buildTimeField() {
    return InkWell(
      onTap: _pickTime,
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: const InputDecoration(labelText: 'Time'),
        child: Text(
          _time == null ? 'Select' : _time!.format(context),
          style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF1E293B)),
        ),
      ),
    );
  }
}