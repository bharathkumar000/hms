import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class AdmissionScreen extends StatefulWidget {
  const AdmissionScreen({super.key});

  @override
  State<AdmissionScreen> createState() => _AdmissionScreenState();
}

class _AdmissionScreenState extends State<AdmissionScreen> {
  late LiveList<Admission> _admissions;

  @override
  void initState() {
    super.initState();
    _admissions = PatientService.watchAdmissions();
  }

  @override
  void dispose() {
    _admissions.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admission'), centerTitle: false),
      body: LiveView<Admission>(
        live: _admissions,
        builder: (context, admissions) {
          final current = admissions.where((a) => a.isAdmitted).isEmpty
              ? null
              : admissions.firstWhere((a) => a.isAdmitted);
          final past = admissions.where((a) => !a.isAdmitted || a.id != current?.id).toList();

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (current == null) ...[
                const EmptyState(
                  'Not currently admitted',
                  icon: Icons.hotel_outlined,
                  subtitle: 'When the hospital admits you, your ward, room, bed and care team will appear here live.',
                ),
                if (past.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const SectionHeader('Previous Admissions'),
                  const SizedBox(height: 12),
                  ...past.map(_buildPastAdmission).toList(),
                ],
              ] else ...[
                _buildCurrentAdmission(current),
                const SizedBox(height: 24),
                const SectionHeader('Bed Transfer History'),
                const SizedBox(height: 12),
                if (current.transfers.isEmpty)
                  const EmptyState(
                    'No transfers',
                    icon: Icons.compare_arrows_rounded,
                    subtitle: 'You have been in the same bed since admission.',
                  )
                else
                  ...current.transfers.map(_buildTransferEntry).toList(),
                if (past.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionHeader('Previous Admissions'),
                  const SizedBox(height: 12),
                  ...past.map(_buildPastAdmission).toList(),
                ],
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _buildCurrentAdmission(Admission a) {
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF13233C), Color(0xFF1D3A5F)],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                const Icon(Icons.medical_information_rounded, color: Colors.white, size: 32),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Admission Status',
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        a.status ?? 'Admitted',
                        style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.verified_rounded, color: Color(0xFF4ADE80), size: 28),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              children: [
                DetailTile(
                  icon: Icons.calendar_today_rounded,
                  label: 'Admitted',
                  value: formatDateTime(a.admissionDate),
                ),
                DetailTile(
                  icon: Icons.event_available_rounded,
                  label: 'Expected D/C',
                  value: formatDate(a.expectedDischargeDate),
                ),
                DetailTile(
                  icon: Icons.location_on_outlined,
                  label: 'Location',
                  value: a.location.isEmpty ? 'To be assigned' : a.location,
                ),
                if (a.wardType != null && a.wardType!.isNotEmpty)
                  DetailTile(
                    icon: Icons.business_rounded,
                    label: 'Ward Type',
                    value: a.wardType!,
                  ),
                DetailTile(
                  icon: Icons.person_rounded,
                  label: 'Doctor',
                  value: a.doctor?.fullName ?? '—',
                ),
                if (a.doctor?.specialization != null)
                  DetailTile(
                    icon: Icons.work_outline_rounded,
                    label: 'Speciality',
                    value: a.doctor!.specialization!,
                  ),
                DetailTile(
                  icon: Icons.medication_rounded,
                  label: 'Care Team',
                  value: 'Nurse: ${a.headNurseName ?? '—'}',
                ),
                if (a.reasonForAdmission != null && a.reasonForAdmission!.isNotEmpty)
                  DetailTile(
                    icon: Icons.notes_rounded,
                    label: 'Reason',
                    value: a.reasonForAdmission!,
                  ),
                if (a.actualDischargeDate != null)
                  DetailTile(
                    icon: Icons.trip_origin_rounded,
                    label: 'Discharged',
                    value: formatDateTime(a.actualDischargeDate),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransferEntry(BedTransfer t) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF0891B2).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.swap_horiz_rounded, color: Color(0xFF0891B2), size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${t.previousBedNumber ?? 'Old bed'} → ${t.newBedNumber ?? 'New bed'}',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                  ),
                  if (t.reason != null && t.reason!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      t.reason!,
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                  const SizedBox(height: 2),
                  Text(
                    formatDateTime(t.transferDate),
                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPastAdmission(Admission a) {
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                a.status ?? 'Admission',
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
              ),
              StatusChip(a.status ?? '—'),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${formatDateTime(a.admissionDate)} — ${formatDateTime(a.actualDischargeDate)}',
            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
          ),
          if (a.doctor != null) ...[
            const SizedBox(height: 4),
            Text(
              'Doctor: ${a.doctor!.fullName}',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
            ),
          ],
          if (a.location.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              'Location: ${a.location}',
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
            ),
          ],
        ],
      ),
    );
  }
}