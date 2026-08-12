import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/app_config.dart';
import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';
import '../admission/admission_screen.dart';
import '../billing/billing_screen.dart';
import '../laboratory/laboratory_screen.dart';
import '../notifications/notifications_screen.dart';
import '../pharmacy/pharmacy_screen.dart';
import '../settings/settings_screen.dart';
import '../home/tab_controller.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late LiveList<Admission> _admissions;
  late LiveList<HospitalNotification> _notifications;
  late Future<PatientProfile?> _profileFuture;
  late Future<Appointment?> _nextAppointmentFuture;
  late Future<double> _pendingBillsFuture;
  late Future<LabOrder?> _latestLabFuture;

  @override
  void initState() {
    super.initState();
    _admissions = PatientService.watchAdmissions();
    _notifications = PatientService.watchNotifications();
    _profileFuture = PatientService.fetchProfile();
    _nextAppointmentFuture = PatientService.fetchNextAppointment();
    _pendingBillsFuture = PatientService.fetchPendingBillsTotal();
    _latestLabFuture = PatientService.fetchLatestLabOrder();
  }

  @override
  void dispose() {
    _admissions.dispose();
    _notifications.dispose();
    super.dispose();
  }

  void _reload() {
    setState(() {
      _profileFuture = PatientService.fetchProfile();
      _nextAppointmentFuture = PatientService.fetchNextAppointment();
      _pendingBillsFuture = PatientService.fetchPendingBillsTotal();
      _latestLabFuture = PatientService.fetchLatestLabOrder();
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          _reload();
          await Future.wait([
            _profileFuture.then((_) {}),
            _nextAppointmentFuture.then((_) {}),
            _pendingBillsFuture.then((_) {}),
            _latestLabFuture.then((_) {}),
          ]);
        },
        color: const Color(0xFF2563EB),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            _buildHeader(),
            const SizedBox(height: 20),
            _buildAdmissionCard(),
            const SizedBox(height: 20),
            _buildNextAppointmentCard(),
            const SizedBox(height: 24),
            _buildSummaryRow(),
            const SizedBox(height: 24),
            _buildQuickAccess(),
            const SizedBox(height: 24),
            _buildRecentNotifications(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return FutureBuilder<PatientProfile?>(
      future: _profileFuture,
      builder: (context, snapshot) {
        final profile = snapshot.data;
        final name = profile?.fullName ?? 'Patient';
        final greeting = _greetingFor(DateTime.now());
        return Row(
          children: [
            InitialsAvatar(name, size: 48),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$greeting,',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    name,
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ],
              ),
            ),
            _buildNotificationBell(),
          ],
        );
      },
    );
  }

  Widget _buildNotificationBell() {
    return StreamBuilder<List<HospitalNotification>>(
      stream: _notifications.stream,
      builder: (context, snapshot) {
        final unread = (snapshot.data ?? const [])
            .where((n) => !n.isRead)
            .length;
        return GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NotificationsScreen()),
          ),
          child: Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                const Icon(Icons.notifications_outlined, color: Color(0xFF1E293B), size: 22),
                if (unread > 0)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      alignment: Alignment.center,
                      child: Text(
                        unread > 9 ? '9+' : '$unread',
                        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAdmissionCard() {
    return StreamBuilder<List<Admission>>(
      stream: _admissions.stream,
      builder: (context, snapshot) {
        final admissions = snapshot.data ?? const <Admission>[];
        final current = admissions.isNotEmpty ? admissions.first : null;
        final admitted = current != null && current.isAdmitted;

        return Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF13233C), Color(0xFF1D3A5F)],
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF13233C).withValues(alpha: 0.2),
                blurRadius: 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    admitted ? Icons.verified_user_rounded : Icons.airline_seat_individual_suite,
                    color: admitted ? const Color(0xFF4ADE80) : const Color(0xFF94A3B8),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    admitted ? 'Currently Admitted' : 'Not Admitted',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (admitted ? const Color(0xFF4ADE80) : const Color(0xFF64748B))
                          .withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      current?.status ?? '—',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: admitted ? const Color(0xFF4ADE80) : const Color(0xFFCBD5E1),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              if (!admitted)
                Text(
                  'You are currently an outpatient. Your admission status will appear here live as soon as the hospital admits you.',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF94A3B8),
                    fontSize: 13,
                    height: 1.5,
                  ),
                )
              else ...[
                _admissionRow('Location', current.location.isNotEmpty ? current.location : 'To be assigned'),
                if (current.doctor != null)
                  _admissionRow('Doctor', current.doctor!.fullName),
                if (current.headNurseName != null && current.headNurseName!.isNotEmpty)
                  _admissionRow('Nurse', current.headNurseName!),
                if (current.reasonForAdmission != null && current.reasonForAdmission!.isNotEmpty)
                  _admissionRow('Reason', current.reasonForAdmission!),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _admissionRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 70,
            child: Text(
              label,
              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNextAppointmentCard() {
    return FutureBuilder<Appointment?>(
      future: _nextAppointmentFuture,
      builder: (context, snapshot) {
        final apt = snapshot.data;
        if (apt == null) {
          return AppCard(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                const Icon(Icons.event_available_outlined, color: Color(0xFF94A3B8), size: 30),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'No Upcoming Appointment',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Book a consultation with a specialist in seconds.',
                        style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => shellTab.value = shellTabOf('appointments'),
                  child: const Text('Book Now'),
                ),
              ],
            ),
          );
        }

        final doctor = apt.doctor;
        return AppCard(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                height: 52,
                width: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.calendar_month_rounded, color: Color(0xFF2563EB), size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Next Appointment',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doctor?.fullName ?? 'Your Doctor',
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${formatDate(apt.date)} · ${formatTime(apt.time)}',
                      style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569)),
                    ),
                  ],
                ),
              ),
              StatusChip(apt.status ?? 'Upcoming'),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow() {
    return Row(
      children: [
        Expanded(
          child: FutureBuilder<double>(
            future: _pendingBillsFuture,
            builder: (context, snapshot) {
              final pending = snapshot.data ?? 0.0;
              return _summaryCard(
                icon: Icons.receipt_long_rounded,
                color: const Color(0xFFD97706),
                title: 'Pending Amount',
                value: money(pending),
                subtitle: 'Total outstanding',
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: FutureBuilder<LabOrder?>(
            future: _latestLabFuture,
            builder: (context, snapshot) {
              final lab = snapshot.data;
              return _summaryCard(
                icon: Icons.science_rounded,
                color: const Color(0xFF7C3AED),
                title: 'Latest Lab Test',
                value: lab?.testCategory ?? 'No tests yet',
                subtitle: lab != null ? 'Status: ${lab.status ?? 'Pending'}' : 'No lab orders',
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _summaryCard({
    required IconData icon,
    required Color color,
    required String title,
    required String value,
    required String subtitle,
  }) {
    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 34,
            width: 34,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAccess() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader('Quick Access'),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 4,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.78,
          children: [
            ModuleTile(
              icon: Icons.calendar_month_rounded,
              label: 'Appointments',
              color: const Color(0xFF2563EB),
              onTap: () => shellTab.value = shellTabOf('appointments'),
            ),
            ModuleTile(
              icon: Icons.bed_rounded,
              label: 'Admission',
              color: const Color(0xFF0891B2),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AdmissionScreen()),
              ),
            ),
            ModuleTile(
              icon: Icons.folder_copy_rounded,
              label: 'Records',
              color: const Color(0xFF0D9488),
              onTap: () => shellTab.value = shellTabOf('records'),
            ),
            ModuleTile(
              icon: Icons.science_rounded,
              label: 'Laboratory',
              color: const Color(0xFF7C3AED),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const LaboratoryScreen()),
              ),
            ),
            ModuleTile(
              icon: Icons.medication_rounded,
              label: 'Prescriptions',
              color: const Color(0xFFDC2626),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PharmacyScreen()),
              ),
            ),
            ModuleTile(
              icon: Icons.receipt_long_rounded,
              label: 'Billing',
              color: const Color(0xFFD97706),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const BillingScreen()),
              ),
            ),
            ModuleTile(
              icon: Icons.restaurant_rounded,
              label: 'Canteen',
              color: const Color(0xFFF59E0B),
              onTap: () => shellTab.value = shellTabOf('canteen'),
            ),
            ModuleTile(
              icon: Icons.notifications_rounded,
              label: 'Alerts',
              color: const Color(0xFFEF4444),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              ),
            ),
            ModuleTile(
              icon: Icons.settings_rounded,
              label: 'Settings',
              color: const Color(0xFF64748B),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SettingsScreen()),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecentNotifications() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(
          'Recent Updates',
          trailing: 'Hospital · ${AppConfig.hospitalName}',
        ),
        const SizedBox(height: 12),
        StreamBuilder<List<HospitalNotification>>(
          stream: _notifications.stream,
          builder: (context, snapshot) {
            final notifications = snapshot.data ?? const <HospitalNotification>[];
            if (notifications.isEmpty) {
              return const EmptyState(
                'No notifications yet',
                icon: Icons.notifications_none_rounded,
                subtitle: 'Updates from the hospital will appear here.',
              );
            }
            return Column(
              children: notifications.take(3).map((n) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    padding: const EdgeInsets.all(14),
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          height: 36,
                          width: 36,
                          decoration: BoxDecoration(
                            color: (n.isRead ? const Color(0xFF94A3B8) : const Color(0xFF2563EB))
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            n.isRead ? Icons.notifications_none_rounded : Icons.notifications_active_rounded,
                            color: n.isRead ? const Color(0xFF94A3B8) : const Color(0xFF2563EB),
                            size: 18,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                n.title ?? 'Update',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                n.message ?? '',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                formatDateTime(n.createdAt),
                                style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ],
    );
  }

  String _greetingFor(DateTime now) {
    final hour = now.hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}