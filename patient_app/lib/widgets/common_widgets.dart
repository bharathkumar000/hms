import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/patient_service.dart';

Widget loadingView() =>
    const Center(child: CircularProgressIndicator(strokeWidth: 2.5));

Color statusColor(String status) {
  const map = <String, Color>{
    'Upcoming': Color(0xFF2563EB),
    'Completed': Color(0xFF16A34A),
    'Cancelled': Color(0xFFEF4444),
    'Paid': Color(0xFF16A34A),
    'Pending': Color(0xFFD97706),
    'Partially Paid': Color(0xFFD97706),
    'Active': Color(0xFF16A34A),
    'Admitted': Color(0xFF2563EB),
    'Discharged': Color(0xFF64748B),
    'In Consultation': Color(0xFF7C3AED),
    'In Progress': Color(0xFF7C3AED),
    'Waiting': Color(0xFFD97706),
    'Preparing': Color(0xFFD97706),
    'Delivering': Color(0xFF0EA5E9),
    'Delivered': Color(0xFF16A34A),
    'Sample Collected': Color(0xFF7C3AED),
    'Sample Requested': Color(0xFF64748B),
    'Sample Received': Color(0xFF7C3AED),
    'Processing': Color(0xFFD97706),
    'Report Ready': Color(0xFF0EA5E9),
    'Released': Color(0xFF16A34A),
    'Draft': Color(0xFF64748B),
    'Approved': Color(0xFF0EA5E9),
    'Partially Dispensed': Color(0xFFD97706),
  };
  return map[status] ?? const Color(0xFF64748B);
}

class StatusChip extends StatelessWidget {
  final String status;
  const StatusChip(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final color = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final String message;
  final IconData icon;
  final String? subtitle;
  const EmptyState(this.message,
      {super.key, this.icon = Icons.inbox_outlined, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 56, color: const Color(0xFFCBD5E1)),
          const SizedBox(height: 16),
          Text(
            message,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF475569),
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(
              subtitle!,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF94A3B8),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Wraps a [StreamBuilder] plus pull-to-refresh around a [LiveList].
class LiveView<T> extends StatelessWidget {
  final LiveList<T> live;
  final Widget Function(BuildContext context, List<T> data) builder;
  const LiveView({super.key, required this.live, required this.builder});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<T>>(
      stream: live.stream,
      builder: (context, snapshot) {
        if (!snapshot.hasData) return loadingView();
        return RefreshIndicator(
          onRefresh: live.refresh,
          color: const Color(0xFF2563EB),
          child: builder(context, snapshot.data ?? const []),
        );
      },
    );
  }
}

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  const AppCard({super.key, required this.child, this.padding, this.onTap});

  @override
  Widget build(BuildContext context) {
    final card = Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: child,
    );
    if (onTap == null) return card;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: onTap,
      child: card,
    );
  }
}

class DetailTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const DetailTile({super.key, required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: const Color(0xFF64748B)),
          const SizedBox(width: 10),
          SizedBox(
            width: 96,
            child: Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF64748B),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF1E293B),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? trailing;
  const SectionHeader(this.title, {super.key, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF1E293B),
          ),
        ),
        if (trailing != null)
          Text(
            trailing!,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
            ),
          ),
      ],
    );
  }
}

class ModuleTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;
  const ModuleTile({
    super.key,
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = const Color(0xFF2563EB),
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: 50,
                width: 50,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      color.withValues(alpha: 0.14),
                      color.withValues(alpha: 0.06),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF334155),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class InitialsAvatar extends StatelessWidget {
  final String text;
  final double size;
  const InitialsAvatar(this.text, {super.key, this.size = 44});

  @override
  Widget build(BuildContext context) {
    final initials = text
        .split(' ')
        .where((e) => e.trim().isNotEmpty)
        .map((e) => e[0])
        .take(2)
        .join()
        .toUpperCase();
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: const Color(0xFF2563EB).withValues(alpha: 0.12),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      alignment: Alignment.center,
      child: Text(
        initials.isEmpty ? 'P' : initials,
        style: GoogleFonts.inter(
          fontSize: size * 0.35,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF1D4ED8),
        ),
      ),
    );
  }
}