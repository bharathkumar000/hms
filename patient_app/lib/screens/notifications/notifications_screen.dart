import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late LiveList<HospitalNotification> _notifications;
  bool _marked = false;

  @override
  void initState() {
    super.initState();
    _notifications = PatientService.watchNotifications();
  }

  @override
  void dispose() {
    _notifications.dispose();
    super.dispose();
  }

  Future<void> _markAllRead() async {
    await PatientService.markAllNotificationsRead();
    if (mounted) {
      setState(() => _marked = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton.icon(
            onPressed: _marked ? null : _markAllRead,
            icon: const Icon(Icons.done_all_rounded, size: 18),
            label: const Text('Mark all read'),
          ),
        ],
      ),
      body: LiveView<HospitalNotification>(
        live: _notifications,
        builder: (context, notifications) {
          if (notifications.isEmpty) {
            return const EmptyState(
              'No notifications',
              icon: Icons.notifications_none_rounded,
              subtitle: 'Updates from the hospital will appear here live.',
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: notifications.length,
            itemBuilder: (context, index) {
              final n = notifications[index];
              return _buildNotificationCard(n);
            },
          );
        },
      ),
    );
  }

  Widget _buildNotificationCard(HospitalNotification n) {
    final color = _typeColor(n.type);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: n.isRead ? const Color(0xFFE2E8F0) : color.withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 40,
            width: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(n.isRead ? Icons.notifications_none_rounded : Icons.notifications_active_rounded, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        n.title ?? 'Update',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: n.isRead ? FontWeight.w600 : FontWeight.w700,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                    ),
                    if (!n.isRead)
                      Container(
                        height: 8,
                        width: 8,
                        decoration: const BoxDecoration(color: Color(0xFF2563EB), shape: BoxShape.circle),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  n.message ?? '',
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), height: 1.4),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (n.type != null && n.type!.isNotEmpty) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          n.type!,
                          style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: color),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      formatDateTime(n.createdAt),
                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _typeColor(String? type) {
    switch (type) {
      case 'Appointment':
        return const Color(0xFF2563EB);
      case 'Billing':
        return const Color(0xFFD97706);
      case 'Report':
        return const Color(0xFF7C3AED);
      default:
        return const Color(0xFF64748B);
    }
  }
}