import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class BillingScreen extends StatefulWidget {
  const BillingScreen({super.key});

  @override
  State<BillingScreen> createState() => _BillingScreenState();
}

class _BillingScreenState extends State<BillingScreen> {
  late LiveList<Bill> _bills;

  @override
  void initState() {
    super.initState();
    _bills = PatientService.watchBills();
  }

  @override
  void dispose() {
    _bills.dispose();
    super.dispose();
  }

  Future<void> _openInvoice(String? url) async {
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open invoice')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Billing & Payments'), centerTitle: false),
      body: LiveView<Bill>(
        live: _bills,
        builder: (context, bills) {
          final totalOutstanding = bills.fold<double>(
            0.0,
            (sum, b) =>
                !(b.status == 'Paid') ? sum + b.outstanding : sum,
          );
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              _buildSummary(totalOutstanding),
              const SizedBox(height: 20),
              const SectionHeader('Bills & Invoices'),
              const SizedBox(height: 12),
              if (bills.isEmpty)
                const EmptyState(
                  'No bills yet',
                  icon: Icons.receipt_long_outlined,
                  subtitle: 'Charges from consultations, tests and medication will appear here.',
                )
              else
                ...bills.map((b) => _buildBillCard(b)).toList(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSummary(double outstanding) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF13233C), Color(0xFF1D3A5F)],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Container(
            height: 48,
            width: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Total Outstanding',
                  style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 4),
                Text(
                  money(outstanding),
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: outstanding > 0 ? const Color(0xFFFFC94D) : const Color(0xFF4ADE80),
                  ),
                ),
                Text(
                  outstanding > 0
                      ? 'Clear dues at the billing desk'
                      : 'All dues cleared',
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBillCard(Bill bill) {
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
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bill.billType ?? 'General',
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      bill.invoiceNumber != null ? 'Invoice #${bill.invoiceNumber}' : 'Bill',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      formatDateTime(bill.createdAt),
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ),
              StatusChip(bill.status ?? 'Pending'),
            ],
          ),
          if (bill.description != null && bill.description!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              bill.description!,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
            ),
          ],
          if (bill.items.isNotEmpty) ...[
            const SizedBox(height: 12),
            const Divider(),
            ...bill.items.map((item) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.itemName ?? 'Item',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                          ),
                          Text(
                            '${item.quantity} × ${money(item.unitPrice)}',
                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      money(item.amount),
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                    ),
                  ],
                ),
              );
            }).toList(),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total Amount',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                ),
                Text(
                  money(bill.totalAmount),
                  style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF2563EB)),
                ),
              ],
            ),
            if (bill.amountPaid != null && bill.amountPaid! > 0) ...[
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Paid',
                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                  ),
                  Text(
                    money(bill.amountPaid),
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF16A34A)),
                  ),
                ],
              ),
            ],
            if (bill.invoiceUrl != null && bill.invoiceUrl!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton.icon(
                  onPressed: () => _openInvoice(bill.invoiceUrl),
                  icon: const Icon(Icons.download_rounded, size: 16),
                  label: const Text('Download Invoice'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF2563EB),
                    side: const BorderSide(color: Color(0xFF2563EB)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}