import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class LaboratoryScreen extends StatefulWidget {
  const LaboratoryScreen({super.key});

  @override
  State<LaboratoryScreen> createState() => _LaboratoryScreenState();
}

class _LaboratoryScreenState extends State<LaboratoryScreen> {
  late LiveList<LabOrder> _labOrders;

  @override
  void initState() {
    super.initState();
    _labOrders = PatientService.watchLabOrders();
  }

  @override
  void dispose() {
    _labOrders.dispose();
    super.dispose();
  }

  Future<void> _download(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open report')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Laboratory'),
        centerTitle: false,
      ),
      body: LiveView<LabOrder>(
        live: _labOrders,
        builder: (context, orders) {
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              if (orders.isEmpty)
                const EmptyState(
                  'No lab tests yet',
                  icon: Icons.science_outlined,
                  subtitle: 'Tests ordered by your doctor will appear here live.',
                )
              else
                ...orders.map(_buildLabOrderCard).toList(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLabOrderCard(LabOrder order) {
    final available = order.hasReport;
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
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
                height: 42,
                width: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.science_rounded, color: Color(0xFF7C3AED), size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            order.testCategory ?? 'Lab Test',
                            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                          ),
                        ),
                        if (order.urgent) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.priority_high_rounded, color: Color(0xFFEF4444), size: 16),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      order.doctor?.fullName ?? 'Ordered by doctor',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Ordered ${formatDateTime(order.createdAt)}',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              StatusChip(order.status ?? 'Pending'),
            ],
          ),
          if (order.notes != null && order.notes!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              order.notes!,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
            ),
          ],
          const Divider(height: 22),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (order.sampleId != null && order.sampleId!.isNotEmpty)
                Text(
                  'Sample: ${order.sampleId}',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                )
              else
                const SizedBox.shrink(),
              if (available)
                FilledButton.icon(
                  onPressed: () => _download(order.reportUrl),
                  icon: const Icon(Icons.download_rounded, size: 16),
                  label: const Text('Download Report'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                )
              else
                Row(
                  children: [
                    const SizedBox(
                      height: 12,
                      width: 12,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF7C3AED)),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Report Pending',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF7C3AED)),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }
}