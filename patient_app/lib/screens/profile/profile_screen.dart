import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../models/patient_models.dart';
import '../../services/auth_service.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';
import '../admission/admission_screen.dart';
import '../billing/billing_screen.dart';
import '../laboratory/laboratory_screen.dart';
import '../notifications/notifications_screen.dart';
import '../pharmacy/pharmacy_screen.dart';
import '../settings/settings_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late LiveList<PatientProfile> _profile;

  @override
  void initState() {
    super.initState();
    _profile = PatientService.watchProfile();
  }

  @override
  void dispose() {
    _profile.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: LiveView<PatientProfile>(
        live: _profile,
        builder: (context, profiles) {
          final profile = profiles.isNotEmpty ? profiles.first : null;
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
              _buildProfileHeader(profile),
              const SizedBox(height: 24),
              const SectionHeader('Personal Details'),
              const SizedBox(height: 12),
              AppCard(
                child: Column(
                  children: [
                    _buildDetailRow(Icons.face_rounded, 'Blood Group', profile?.bloodGroup ?? '—'),
                    _buildDivider(),
                    _buildDetailRow(Icons.cake_outlined, 'Date of Birth', formatDate(profile?.dateOfBirth)),
                    _buildDivider(),
                    _buildDetailRow(Icons.wc_rounded, 'Gender', profile?.gender ?? '—'),
                    _buildDivider(),
                    _buildDetailRow(Icons.phone_outlined, 'Phone', profile?.phoneNumber ?? '—'),
                    _buildDivider(),
                    _buildDetailRow(Icons.home_outlined, 'Address', profile?.address ?? '—'),
                    _buildDivider(),
                    _buildDetailRow(Icons.emergency_outlined, 'Emergency Contact', _emergencyContact(profile)),
                    _buildDivider(),
                    _buildDetailRow(Icons.savings_outlined, 'Insurance', profile?.insuranceProvider ?? '—'),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => _ProfileEditScreen(profile: profile),
                    ),
                  ),
                  icon: const Icon(Icons.edit_outlined, size: 18),
                  label: const Text('Edit Profile'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF2563EB),
                    side: const BorderSide(color: Color(0xFF2563EB)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const SectionHeader('Account & Hospital Services'),
              const SizedBox(height: 12),
              _buildMenuOption(
                Icons.credit_card_rounded,
                'Billing & Payments',
                const Color(0xFFD97706),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BillingScreen())),
              ),
              _buildMenuOption(
                Icons.science_rounded,
                'Laboratory Reports',
                const Color(0xFF7C3AED),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LaboratoryScreen())),
              ),
              _buildMenuOption(
                Icons.medication_rounded,
                'Prescriptions',
                const Color(0xFFDC2626),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PharmacyScreen())),
              ),
              _buildMenuOption(
                Icons.bed_rounded,
                'My Admission',
                const Color(0xFF0891B2),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AdmissionScreen())),
              ),
              _buildMenuOption(
                Icons.notifications_outlined,
                'Notifications',
                const Color(0xFFEF4444),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
              ),
              _buildMenuOption(
                Icons.settings_outlined,
                'Settings',
                const Color(0xFF64748B),
                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SettingsScreen())),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout_rounded, size: 20),
                label: const Text('Logout'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFEF4444),
                  side: const BorderSide(color: Color(0xFFEF4444)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildProfileHeader(PatientProfile? profile) {
    final name = profile?.fullName ?? 'Patient';
    final uid = AuthService.currentUserId ?? '';
    final shortId = uid.length >= 8 ? uid.substring(0, 8).toUpperCase() : uid;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF13233C), Color(0xFF1D3A5F)],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        children: [
          InitialsAvatar(name, size: 76),
          const SizedBox(height: 12),
          Text(
            name,
            style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(
            'Patient ID: $shortId',
            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF64748B)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
          ),
        ],
      ),
    );
  }

  Widget _buildDivider() => const Divider(height: 1);

  String _emergencyContact(PatientProfile? p) {
    if (p == null) return '—';
    final name = p.emergencyContactName;
    final phone = p.emergencyContactPhone;
    if (name != null && name.isNotEmpty && phone != null && phone.isNotEmpty) {
      return '$name · $phone';
    }
    return name ?? phone ?? '—';
  }

  Widget _buildMenuOption(IconData icon, String title, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              height: 36,
              width: 36,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
          ],
        ),
      ),
    );
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Logout', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to sign out?', style: GoogleFonts.inter(fontSize: 14)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Logout', style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      PatientService.disposeAll();
      await AuthService.logout();
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
      }
    }
  }
}

class _ProfileEditScreen extends StatefulWidget {
  final PatientProfile? profile;
  const _ProfileEditScreen({this.profile});

  @override
  State<_ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<_ProfileEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _phone;
  late final TextEditingController _address;
  late final TextEditingController _emergencyName;
  late final TextEditingController _emergencyPhone;
  late final TextEditingController _insuranceProvider;
  late final TextEditingController _insurancePolicy;
  DateTime? _dob;
  String? _gender;
  String? _bloodGroup;
  bool _saving = false;

  static const _genders = ['Male', 'Female', 'Other'];
  static const _bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _firstName = TextEditingController(text: p?.firstName ?? '');
    _lastName = TextEditingController(text: p?.lastName ?? '');
    _phone = TextEditingController(text: p?.phoneNumber ?? '');
    _address = TextEditingController(text: p?.address ?? '');
    _emergencyName = TextEditingController(text: p?.emergencyContactName ?? '');
    _emergencyPhone = TextEditingController(text: p?.emergencyContactPhone ?? '');
    _insuranceProvider = TextEditingController(text: p?.insuranceProvider ?? '');
    _insurancePolicy = TextEditingController(text: p?.insurancePolicyNumber ?? '');
    _dob = p?.dateOfBirth;
    _gender = p?.gender;
    _bloodGroup = p?.bloodGroup;
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _phone.dispose();
    _address.dispose();
    _emergencyName.dispose();
    _emergencyPhone.dispose();
    _insuranceProvider.dispose();
    _insurancePolicy.dispose();
    super.dispose();
  }

  Future<void> _pickDob() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(1990, 1, 1),
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _dob = picked);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (widget.profile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile cannot be created automatically. Contact reception.')),
      );
      return;
    }
    setState(() => _saving = true);

    final updated = PatientProfile(
      id: AuthService.currentUserId ?? '',
      firstName: _firstName.text.trim().isEmpty ? null : _firstName.text.trim(),
      lastName: _lastName.text.trim().isEmpty ? null : _lastName.text.trim(),
      dateOfBirth: _dob,
      gender: _gender,
      phoneNumber: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
      address: _address.text.trim().isEmpty ? null : _address.text.trim(),
      emergencyContactName: _emergencyName.text.trim().isEmpty ? null : _emergencyName.text.trim(),
      emergencyContactPhone: _emergencyPhone.text.trim().isEmpty ? null : _emergencyPhone.text.trim(),
      bloodGroup: _bloodGroup,
      insuranceProvider: _insuranceProvider.text.trim().isEmpty ? null : _insuranceProvider.text.trim(),
      insurancePolicyNumber: _insurancePolicy.text.trim().isEmpty ? null : _insurancePolicy.text.trim(),
    );

    final err = await PatientService.saveProfile(updated);
    if (!mounted) return;
    setState(() => _saving = false);
    if (err == null) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save profile: $err')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile'), centerTitle: false),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _firstName,
                    decoration: const InputDecoration(labelText: 'First Name'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _lastName,
                    decoration: const InputDecoration(labelText: 'Last Name'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildDobField(),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _gender,
              decoration: const InputDecoration(labelText: 'Gender'),
              items: _genders
                  .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                  .toList(),
              onChanged: (v) => setState(() => _gender = v),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _bloodGroup,
              decoration: const InputDecoration(labelText: 'Blood Group'),
              items: _bloodGroups
                  .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                  .toList(),
              onChanged: (v) => setState(() => _bloodGroup = v),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone Number'),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _address,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Address'),
            ),
            const SizedBox(height: 24),
            Text(
              'Emergency Contact',
              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emergencyName,
              decoration: const InputDecoration(labelText: 'Contact Name'),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emergencyPhone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Contact Phone'),
            ),
            const SizedBox(height: 24),
            Text(
              'Insurance',
              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _insuranceProvider,
              decoration: const InputDecoration(labelText: 'Insurance Provider'),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _insurancePolicy,
              decoration: const InputDecoration(labelText: 'Policy Number'),
            ),
            const SizedBox(height: 28),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                onPressed: _saving ? null : _save,
                child: _saving
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                      )
                    : const Text('Save Changes'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDobField() {
    return InkWell(
      onTap: _pickDob,
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: const InputDecoration(labelText: 'Date of Birth'),
        child: Text(
          _dob == null ? 'Select' : DateFormat('dd MMM yyyy').format(_dob!),
          style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF1E293B)),
        ),
      ),
    );
  }
}