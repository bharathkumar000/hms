import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  late LiveList<MedicalRecord> _records;
  late LiveList<Admission> _admissions;

  @override
  void initState() {
    super.initState();
    _records = PatientService.watchMedicalRecords();
    _admissions = PatientService.watchAdmissions();
  }

  @override
  void dispose() {
    _records.dispose();
    _admissions.dispose();
    super.dispose();
  }

  Future<void> _openUrl(String? url, String label) async {
    if (url == null || url.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Document not available yet')),
      );
      return;
    }
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open document')),
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Medical Records',
                  style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                ),
                Text(
                  'Your clinical history and reports',
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: StreamBuilder<List<MedicalRecord>>(
              stream: _records.stream,
              builder: (context, snapshot) {
                if (!snapshot.hasData) return loadingView();
                final records = snapshot.data ?? const <MedicalRecord>[];
                return RefreshIndicator(
                  onRefresh: _records.refresh,
                  color: const Color(0xFF2563EB),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                    children: [
                      StreamBuilder<List<Admission>>(
                        stream: _admissions.stream,
                        builder: (context, admissionSnapshot) {
                          final admissions = (admissionSnapshot.data ?? const <Admission>[])
                              .where((a) => a.status == 'Discharged')
                              .toList();
                          if (records.isEmpty && admissions.isEmpty) {
                            return const EmptyState(
                              'No medical records yet',
                              icon: Icons.folder_open_rounded,
                              subtitle: 'Your clinical history will appear here as doctors update it.',
                            );
                          }
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              ...admissions.map(_buildDischargeSummary).toList(),
                              ...records.map((r) => _buildRecordCard(r)).toList(),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDischargeSummary(Admission a) {
    return _TimelineEntry(
      icon: Icons.assignment_rounded,
      color: const Color(0xFF0891B2),
      title: 'Discharge Summary',
      subtitle: '${a.doctor?.fullName ?? 'Hospital'} · ${formatDate(a.actualDischargeDate ?? a.admissionDate)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (a.reasonForAdmission != null && a.reasonForAdmission!.isNotEmpty)
            _note('Reason', a.reasonForAdmission!),
          if (a.location.isNotEmpty) _note('Location', a.location),
          const SizedBox(height: 4),
          Text(
            'Status: ${a.status}',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF0891B2)),
          ),
        ],
      ),
    );
  }

  Widget _note(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: '$label: ',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
            ),
            TextSpan(
              text: value,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordCard(MedicalRecord r) {
    final doctor = r.doctor;
    return _TimelineEntry(
      icon: Icons.description_rounded,
      color: const Color(0xFF0D9488),
      title: r.diagnosis ?? 'Medical Record',
      subtitle: '${doctor?.fullName ?? 'Doctor'} · ${formatDate(r.recordDate)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (r.doctorNotes != null && r.doctorNotes!.isNotEmpty)
            Text(
              r.doctorNotes!,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569), height: 1.5),
            ),
          if (r.documents.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...r.documents.map((doc) => _buildDocumentChip(doc)).toList(),
          ],
        ],
      ),
    );
  }

  Widget _buildDocumentChip(DocumentItem doc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () => _openUrl(doc.documentUrl, doc.title ?? 'Document'),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFEF4444), size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doc.title ?? doc.documentType ?? 'Report',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                    ),
                    Text(
                      doc.documentType ?? 'Document',
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.download_rounded, color: Color(0xFF2563EB), size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimelineEntry extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final Widget child;

  const _TimelineEntry({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Column(
            children: [
              Container(
                height: 40,
                width: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              Expanded(
                child: Container(width: 2, color: const Color(0xFFE2E8F0)),
              ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                    if (child is! SizedBox) ...[
                      const SizedBox(height: 10),
                      child,
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}