import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class PharmacyScreen extends StatefulWidget {
  const PharmacyScreen({super.key});

  @override
  State<PharmacyScreen> createState() => _PharmacyScreenState();
}

class _PharmacyScreenState extends State<PharmacyScreen> {
  late LiveList<Prescription> _prescriptions;

  @override
  void initState() {
    super.initState();
    _prescriptions = PatientService.watchPrescriptions();
  }

  @override
  void dispose() {
    _prescriptions.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Prescriptions'), centerTitle: false),
      body: LiveView<Prescription>(
        live: _prescriptions,
        builder: (context, prescriptions) {
          final active =
              prescriptions.where((p) => p.isActive).toList();
          final previous =
              prescriptions.where((p) => !p.isActive).toList();

          if (prescriptions.isEmpty) {
            return const EmptyState(
              'No prescriptions yet',
              icon: Icons.medication_outlined,
              subtitle: 'Medicines prescribed by your doctor will appear here.',
            );
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              const SectionHeader('Active Prescriptions'),
              const SizedBox(height: 12),
              if (active.isEmpty)
                const EmptyState(
                  'No active prescriptions',
                  icon: Icons.check_circle_outline_rounded,
                )
              else
                ...active.map((p) => _buildPrescriptionCard(p, active: true)).toList(),
              if (previous.isNotEmpty) ...[
                const SizedBox(height: 24),
                const SectionHeader('Previous'),
                const SizedBox(height: 12),
                ...previous.map((p) => _buildPrescriptionCard(p, active: false)).toList(),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget _buildPrescriptionCard(Prescription p, {required bool active}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: active ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
          width: active ? 1.5 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 42,
                width: 42,
                decoration: BoxDecoration(
                  color: (active ? const Color(0xFF16A34A) : const Color(0xFF64748B))
                      .withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  active ? Icons.medication_rounded : Icons.medication_outlined,
                  color: active ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.medicineName ?? 'Medicine',
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      p.doctor?.fullName ?? 'Prescribed by doctor',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              StatusChip(active ? (p.dispenseStatus ?? p.status ?? 'Active') : 'Completed'),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: [
              _meta(Icons.monitor_weight_outlined, 'Dosage', p.dosage ?? '—'),
              _meta(Icons.schedule_rounded, 'Frequency', p.frequency ?? '—'),
              _meta(Icons.hourglass_bottom_rounded, 'Duration', p.duration ?? '—'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _meta(IconData icon, String label, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 4),
        Text(
          '$label: ',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
        Text(
          value,
          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
        ),
      ],
    );
  }
}