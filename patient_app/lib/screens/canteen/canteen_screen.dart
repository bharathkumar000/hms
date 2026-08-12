import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/patient_models.dart';
import '../../services/patient_service.dart';
import '../../widgets/common_widgets.dart';

class CanteenScreen extends StatefulWidget {
  const CanteenScreen({super.key});

  @override
  State<CanteenScreen> createState() => _CanteenScreenState();
}

class CartItem {
  final MenuItem item;
  int quantity;
  CartItem(this.item, this.quantity);
}

class _CanteenScreenState extends State<CanteenScreen> {
  late LiveList<CanteenCategory> _categories;
  late LiveList<MenuItem> _menu;
  late LiveList<CanteenOrder> _orders;
  late LiveList<Admission> _admissions;

  String _activeCategory = 'All';
  String _search = '';
  String? _deliveryLocation;
  String? _admissionId;
  final List<CartItem> _cart = [];
  bool _placing = false;

  @override
  void initState() {
    super.initState();
    _categories = PatientService.watchCanteenCategories();
    _menu = PatientService.watchMenuItems();
    _orders = PatientService.watchCanteenOrders();
    _admissions = PatientService.watchAdmissions();
  }

  @override
  void dispose() {
    _categories.dispose();
    _menu.dispose();
    _orders.dispose();
    _admissions.dispose();
    super.dispose();
  }

  String _deriveLocation(Admission? a) {
    if (a != null && a.isAdmitted && a.location.isNotEmpty) {
      return 'Ward ${a.location}';
    }
    return 'Self Pickup';
  }

  Future<void> _placeOrder() async {
    if (_cart.isEmpty) return;
    setState(() => _placing = true);

    final total = _cart.fold<double>(
        0.0, (sum, c) => sum + ((c.item.price ?? 0) * c.quantity));

    final err = await PatientService.placeCanteenOrder(
      items: _cart
          .map((c) => {
                'menu_item_id': c.item.id,
                'quantity': c.quantity,
                'price_at_time': c.item.price,
              })
          .toList(),
      totalAmount: total,
      deliveryLocation: _deliveryLocation ?? 'Self Pickup',
      admissionId: _admissionId,
    );

    if (!mounted) return;
    setState(() => _placing = false);
    if (err == null) {
      _cart.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Order placed successfully!')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to place order: $err')),
      );
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
            child: Text(
              'Hospital Canteen',
              style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
            ),
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: StreamBuilder<List<Admission>>(
              stream: _admissions.stream,
              builder: (context, snapshot) {
                final admission =
                    (snapshot.data ?? const <Admission>[]).where((a) => a.isAdmitted).isEmpty
                        ? null
                        : (snapshot.data ?? const <Admission>[]).firstWhere((a) => a.isAdmitted);
                _deliveryLocation = _deriveLocation(admission);
                _admissionId = admission?.id;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 18, color: Color(0xFF2563EB)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Delivering to: $_deliveryLocation',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF1E3A8A)),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: DefaultTabController(
              length: 2,
              child: Column(
                children: [
                  const TabBar(
                    labelColor: Color(0xFF2563EB),
                    unselectedLabelColor: Color(0xFF64748B),
                    indicatorColor: Color(0xFF2563EB),
                    labelStyle: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    tabs: [
                      Tab(text: 'Menu'),
                      Tab(text: 'Cart & Orders'),
                    ],
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _buildMenuTab(),
                        _buildOrdersTab(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuTab() {
    return LiveView<MenuItem>(
      live: _menu,
      builder: (context, items) {
        return StreamBuilder<List<CanteenCategory>>(
          stream: _categories.stream,
          builder: (context, categorySnapshot) {
            final categories = categorySnapshot.data ?? const <CanteenCategory>[];
            final filtered = items.where((item) {
              final matchesCategory =
                  _activeCategory == 'All' || item.categoryName == _activeCategory;
              final matchesSearch = _search.isEmpty ||
                  (item.name?.toLowerCase().contains(_search.toLowerCase()) ?? false);
              return matchesCategory && matchesSearch && item.isAvailable;
            }).toList();

            return ListView(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
              children: [
                _buildCategoryChips(categories),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        onChanged: (v) => setState(() => _search = v),
                        decoration: const InputDecoration(
                          hintText: 'Search menu...',
                          prefixIcon: Icon(Icons.search_rounded),
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      height: 48,
                      width: 48,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(
                          '${_cart.fold<int>(0, (s, c) => s + c.quantity)}',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (filtered.isEmpty)
                  const EmptyState(
                    'No items found',
                    icon: Icons.search_off_rounded,
                    subtitle: 'Try a different category or search term.',
                  )
                else
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 0.82,
                    children: filtered.map((item) => _buildMenuItem(item)).toList(),
                  ),
              ],
            );
          },
        );
      },
    );
  }

  Widget _buildCategoryChips(List<CanteenCategory> categories) {
    return SizedBox(
      height: 36,
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: [
          _chip('All Items', 'All'),
          ...categories.map((c) => _chip(c.name ?? '', c.name ?? '')),
        ],
      ),
    );
  }

  Widget _chip(String label, String value) {
    final selected = _activeCategory == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        onTap: () => setState(() => _activeCategory = value),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected ? const Color(0xFF2563EB) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : const Color(0xFF64748B),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(MenuItem item) {
    final cartIndex = _cart.indexWhere((c) => c.item.id == item.id);
    final qty = cartIndex >= 0 ? _cart[cartIndex].quantity : 0;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ItemThumb(item.name ?? ''),
          const SizedBox(height: 8),
          Text(
            item.name ?? '',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
          ),
          const SizedBox(height: 2),
          Expanded(
            child: Text(
              item.description ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                money(item.price),
                style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF2563EB)),
              ),
              if (qty == 0)
                InkWell(
                  onTap: () {
                    setState(() => _cart.add(CartItem(item, 1)));
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    height: 30,
                    width: 30,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                  ),
                )
              else
                Row(
                  children: [
                    _qtyButton(Icons.remove_rounded, () {
                      setState(() {
                        final c = _cart[cartIndex];
                        if (c.quantity > 1) {
                          c.quantity--;
                        } else {
                          _cart.removeAt(cartIndex);
                        }
                      });
                    }),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text(
                        '$qty',
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
                      ),
                    ),
                    _qtyButton(Icons.add_rounded, () {
                      setState(() => _cart[cartIndex].quantity++);
                    }),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        height: 28,
        width: 28,
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: const Color(0xFF2563EB), size: 16),
      ),
    );
  }

  Widget _buildOrdersTab() {
    return LiveView<CanteenOrder>(
      live: _orders,
      builder: (context, orders) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          children: [
            _buildCartCard(),
            const SizedBox(height: 20),
            const SectionHeader('Order History'),
            const SizedBox(height: 12),
            if (orders.isEmpty)
              const EmptyState(
                'No orders yet',
                icon: Icons.restaurant_outlined,
                subtitle: 'Your food orders will appear here live.',
              )
            else
              ...orders.map(_buildOrderCard).toList(),
          ],
        );
      },
    );
  }

  Widget _buildCartCard() {
    final total = _cart.fold<double>(
        0.0, (sum, c) => sum + (c.item.price ?? 0) * c.quantity);

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shopping_cart_outlined, color: Color(0xFF1E293B), size: 20),
              const SizedBox(width: 8),
              Text(
                'Your Cart',
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Delivery Location',
                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                ),
                const SizedBox(height: 2),
                Text(
                  _deliveryLocation ?? 'Self Pickup',
                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          if (_cart.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text(
                  'Your cart is empty. Add items from the Menu tab.',
                  style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF94A3B8)),
                ),
              ),
            )
          else ...[
            ..._cart.map((c) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c.item.name ?? '',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                          ),
                          Text(
                            money(c.item.price),
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    _qtyButton(Icons.remove_rounded, () {
                      setState(() {
                        if (c.quantity > 1) {
                          c.quantity--;
                        } else {
                          _cart.remove(c);
                        }
                      });
                    }),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        '${c.quantity}',
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                      ),
                    ),
                    _qtyButton(Icons.add_rounded, () => setState(() => c.quantity++)),
                  ],
                ),
              );
            }).toList(),
            const Divider(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Total',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                Text(
                  money(total),
                  style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w700, color: const Color(0xFF2563EB)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 48,
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _placing ? null : _placeOrder,
                icon: _placing
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check_rounded, size: 18),
                label: Text(_placing ? 'Placing Order...' : 'Place Order'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOrderCard(CanteenOrder order) {
    final itemList = order.items
        .map((i) => '${i.quantity}x ${i.menuItemName ?? 'Item'}' )
        .where((s) => s.isNotEmpty)
        .join(', ');
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
                child: Text(
                  formatDateTime(order.createdAt),
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                ),
              ),
              StatusChip(order.status ?? 'Pending'),
            ],
          ),
          if (itemList.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              itemList,
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
            ),
          ],
          const SizedBox(height: 6),
          Text(
            'Total: ${money(order.totalAmount)}',
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B)),
          ),
        ],
      ),
    );
  }
}

class ItemThumb extends StatelessWidget {
  final String name;
  const ItemThumb(this.name, {super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
      ),
      alignment: Alignment.center,
      child: const Icon(Icons.restaurant_rounded, color: Color(0xFF94A3B8), size: 32),
    );
  }
}