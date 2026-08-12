import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../appointments/appointments_screen.dart';
import '../canteen/canteen_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../profile/profile_screen.dart';
import '../records/records_screen.dart';
import 'tab_controller.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    shellTab.addListener(_onTabChanged);
  }

  @override
  void dispose() {
    shellTab.removeListener(_onTabChanged);
    super.dispose();
  }

  void _onTabChanged() {
    if (!mounted) return;
    setState(() => _index = shellTab.value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: IndexedStack(
        index: _index,
        children: const [
          DashboardScreen(),
          AppointmentsScreen(),
          CanteenScreen(),
          RecordsScreen(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          height: 64,
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _navItem(0, Icons.home_filled, Icons.home_outlined, 'Home'),
              _navItem(1, Icons.calendar_month, Icons.calendar_month_outlined, 'Appointments'),
              _navItem(2, Icons.restaurant_rounded, Icons.restaurant_outlined, 'Canteen'),
              _navItem(3, Icons.folder_copy_rounded, Icons.folder_copy_outlined, 'Records'),
              _navItem(4, Icons.person_rounded, Icons.person_outline_rounded, 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData selected, IconData unselected, String label) {
    final isSelected = _index == index;
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () => setState(() => _index = index),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isSelected ? selected : unselected,
                color: isSelected ? Colors.white : const Color(0xFF94A3B8), size: 22),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 9,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}