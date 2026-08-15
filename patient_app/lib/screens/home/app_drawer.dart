import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../admission/admission_screen.dart';
import '../billing/billing_screen.dart';
import '../laboratory/laboratory_screen.dart';
import '../notifications/notifications_screen.dart';
import '../pharmacy/pharmacy_screen.dart';
import '../settings/settings_screen.dart';
import 'tab_controller.dart';

/// Left-hand navigation drawer. Contains every app feature grouped into
/// "Your Care" (use anytime) and "Hospital Only" (available once admitted).
class AppDrawer extends StatefulWidget {
  const AppDrawer({super.key});

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
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

  void _goTab(BuildContext context, int tab) {
    Navigator.of(context).pop();
    shellTab.value = tab;
  }

  void _go(BuildContext context, Widget screen) {
    Navigator.of(context).pop();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFF0F172A),
      width: 310,
      child: SafeArea(
        child: StreamBuilder<List<Admission>>(
          stream: _admissions.stream,
          builder: (context, snapshot) {
            final admissions = snapshot.data ?? const <Admission>[];
            final current = admissions.isNotEmpty ? admissions.first : null;
            final admitted = current != null && current.isAdmitted;

            return ListView(
              padding: EdgeInsets.zero,
              children: [
                _buildHeader(context, current, admitted),
                const SizedBox(height: 8),
                const _DrawerSectionLabel('Your Care'),
                _DrawerItem(
                  icon: Icons.space_dashboard_rounded,
                  label: 'Dashboard',
                  onTap: () => _goTab(context, 0),
                ),
                _DrawerItem(
                  icon: Icons.calendar_month_rounded,
                  label: 'Appointments',
                  onTap: () => _goTab(context, 1),
                ),
                _DrawerItem(
                  icon: Icons.folder_copy_rounded,
                  label: 'Medical Records',
                  onTap: () => _goTab(context, 3),
                ),
                _DrawerItem(
                  icon: Icons.medication_rounded,
                  label: 'Medication Reminders',
                  onTap: () => _go(context, const PharmacyScreen()),
                ),
                _DrawerItem(
                  icon: Icons.person_rounded,
                  label: 'Profile',
                  onTap: () => _goTab(context, 4),
                ),
                const Divider(color: Color(0xFF1E293B)),
                const _DrawerSectionLabel('Hospital Only'),
                if (admitted)
                  _DrawerItem(
                    icon: Icons.support_agent_rounded,
                    label: 'Call Nurse',
                    onTap: () => _callNurse(context, current),
                  ),
                _DrawerItem(
                  icon: Icons.restaurant_rounded,
                  label: 'Canteen',
                  onTap: admitted
                      ? () => _goTab(context, 2)
                      : null,
                ),
                _DrawerItem(
                  icon: Icons.bed_rounded,
                  label: 'My Admission',
                  onTap: admitted
                      ? () => _go(context, const AdmissionScreen())
                      : null,
                ),
                _DrawerItem(
                  icon: Icons.science_rounded,
                  label: 'Laboratory',
                  onTap: admitted
                      ? () => _go(context, const LaboratoryScreen())
                      : null,
                ),
                _DrawerItem(
                  icon: Icons.receipt_long_rounded,
                  label: 'Billing',
                  onTap: admitted
                      ? () => _go(context, const BillingScreen())
                      : null,
                ),
                if (!admitted)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                    child: Text(
                      'Locked until you are admitted. Once the hospital admits you, these services unlock live.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF64748B),
                        height: 1.4,
                      ),
                    ),
                  ),
                const Divider(color: Color(0xFF1E293B)),
                const _DrawerSectionLabel('More'),
                _DrawerItem(
                  icon: Icons.notifications_rounded,
                  label: 'Notifications & Alerts',
                  onTap: () => _go(context, const NotificationsScreen()),
                ),
                _DrawerItem(
                  icon: Icons.settings_rounded,
                  label: 'Settings',
                  onTap: () => _go(context, const SettingsScreen()),
                ),
                const SizedBox(height: 16),
              ],
            );
          },
        ),
      ),
    );
  }

  Future<void> _callNurse(BuildContext context, Admission admission) async {
    final location =
        admission.location.isNotEmpty ? admission.location : 'your room';
    final nurse = (admission.headNurseName != null &&
            admission.headNurseName!.trim().isNotEmpty)
        ? admission.headNurseName!
        : 'the nursing station';
    Navigator.of(context).pop();

    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Container(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
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
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.support_agent_rounded, color: Color(0xFF2563EB), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Call Nurse',
                      style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                'Your request will notify the nursing station for $location.',
                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569), height: 1.5),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    height: 40,
                    width: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      nurse.split(' ').take(2).map((e) => e[0]).join().toUpperCase(),
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF334155)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Assigned Nurse',
                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                        ),
                        Text(
                          nurse,
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: 52,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(sheetContext).pop();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Nurse has been notified')),
                    );
                  },
                  child: const Text('Notify Nurse Now'),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 44,
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.of(sheetContext).pop(),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader(BuildContext context, Admission? current, bool admitted) {
    return FutureBuilder<PatientProfile?>(
      future: PatientService.fetchProfile(),
      builder: (context, snapshot) {
        final profile = snapshot.data;
        final name = profile?.fullName ?? 'Patient';
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1D3A5F), Color(0xFF13233C)],
            ),
          ),
          child: Row(
            children: [
              Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF2563EB).withValues(alpha: 0.3),
                ),
                alignment: Alignment.center,
                child: Text(
                  _initials(name),
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      admitted
                          ? 'Admitted · ${current?.location ?? '—'}'
                          : 'Outpatient',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: admitted ? const Color(0xFF4ADE80) : const Color(0xFF94A3B8),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _initials(String name) {
    final parts =
        name.split(' ').where((e) => e.trim().isNotEmpty).toList();
    return parts.isEmpty
        ? 'P'
        : parts.take(2).map((e) => e[0]).join().toUpperCase();
  }
}

class _DrawerSectionLabel extends StatelessWidget {
  final String label;
  const _DrawerSectionLabel(this.label);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          color: const Color(0xFF64748B),
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _DrawerItem({
    required this.icon,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return ListTile(
      onTap: onTap,
      enabled: enabled,
      leading: Icon(
        icon,
        color: enabled ? const Color(0xFFE2E8F0) : const Color(0xFF475569),
        size: 21,
      ),
      title: Row(
        children: [
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: enabled ? Colors.white : const Color(0xFF475569),
              ),
            ),
          ),
          if (!enabled) ...[
            const SizedBox(width: 8),
            const _LockedChip(),
          ],
        ],
      ),
      trailing: enabled
          ? const Icon(Icons.chevron_right_rounded, color: Color(0xFF475569), size: 18)
          : null,
      dense: true,
    );
  }
}

class _LockedChip extends StatelessWidget {
  const _LockedChip();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFF334155),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        'LOCKED',
        style: GoogleFonts.inter(
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF94A3B8),
        ),
      ),
    );
  }
}