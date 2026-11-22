import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CashierTab from './components/CashierTab';
import InventoryTab from './components/InventoryTab';
import AnalyticsTab from './components/AnalyticsTab';
import ReceiptsTab from './components/ReceiptsTab';
import TaxTab from './components/TaxTab';
import ProductModal from './components/modals/ProductModal';
import RestockModal from './components/modals/RestockModal';
import BarcodeModal from './components/modals/BarcodeModal';
import ReceiptModal from './components/modals/ReceiptModal';
import UpdateModal from './components/modals/UpdateModal';
import StoreSettingsModal from './components/modals/StoreSettingsModal';
import AlertModal from './components/modals/AlertModal';
import { normalizeBarcode, getCharFromKeyEvent } from './utils/barcode';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos', 'inventory', 'accounting', 'receipts', 'tax'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Custom Alert Modal State
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    detail: ''
  });

  const showAlert = (message, type = 'warning', title = '', detail = '') => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      message,
      detail
    });
  };

  const closeAlert = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };

  // App Version & Auto-Updater State
  const [appVersion, setAppVersion] = useState('1.1.1');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateState, setUpdateState] = useState({
    status: 'idle',
    version: '',
    currentVersion: '1.1.1',
    percent: 0,
    speed: 0,
    transferred: 0,
    total: 0,
    message: '',
    isPackaged: false
  });

  // POS State
  const [cart, setCart] = useState([]);
  const [cashReceived, setCashReceived] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    barcode: '',
    category: 'ทั่วไป',
    pack_count: '1',
    pack_cost: '',
    pack_qty: '',
    cost_price: '',
    profit_margin: '',
    sell_price: '',
    stock_qty: '',
    min_stock: '5'
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Quick Restock Modal
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockForm, setRestockForm] = useState({
    add_qty: '',
    batch_cost: '',
    update_cost_price: true,
    note: 'เติมสต็อกสินค้า'
  });

  // Barcode Modal
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState(null);
  const [printCopies, setPrintCopies] = useState(30);

  // Accounting & Orders State
  const [orderHistory, setOrderHistory] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [reportTimeframe, setReportTimeframe] = useState('today'); // 'today', 'week', 'month', 'all'
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Thai Tax State
  const [taxSummary, setTaxSummary] = useState(null);
  const [taxCashFlow, setTaxCashFlow] = useState(null);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [taxPeriod, setTaxPeriod] = useState('all'); // 'all', 'h1', 'h2'
  const [expenses, setExpenses] = useState([]);

  // Store Customization Settings State
  const [storeSettings, setStoreSettings] = useState({
    store_name: 'Pouch',
    store_subtitle: 'ระบบแคชเชียร์ & คลังสต็อก',
    tax_id: '0105566012345',
    logo_url: '/logo.png'
  });
  const [isStoreSettingsOpen, setIsStoreSettingsOpen] = useState(false);

  // Audio feedback for scanner
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Ignore before user interaction
    }
  };

  // Fetch Products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Orders & Stock Logs
  const fetchAccountingData = async () => {
    try {
      const [ordersRes, logsRes] = await Promise.all([
        fetch('/api/orders?limit=500'),
        fetch('/api/reports/stock-logs')
      ]);
      const ordersData = await ordersRes.json();
      const logsData = await logsRes.json();

      setOrderHistory(ordersData);
      setStockLogs(logsData);
    } catch (err) {
      console.error('Fetch accounting error:', err);
    }
  };

  // Fetch Tax Compliance & Cash Flow
  const fetchTaxData = async () => {
    try {
      const [taxSumRes, taxFlowRes, expensesRes] = await Promise.all([
        fetch(`/api/tax/summary?year=${taxYear}`),
        fetch(`/api/tax/cash-flow?year=${taxYear}&period=${taxPeriod}`),
        fetch('/api/expenses')
      ]);
      const taxSumData = await taxSumRes.json();
      const taxFlowData = await taxFlowRes.json();
      const expData = await expensesRes.json();

      setTaxSummary(taxSumData);
      setTaxCashFlow(taxFlowData);
      setExpenses(expData);
    } catch (err) {
      console.error('Fetch tax error:', err);
    }
  };

  // Fetch Store Settings
  const fetchStoreSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setStoreSettings(data);
      }
    } catch (err) {
      console.error('Fetch store settings error:', err);
    }
  };

  // Handle Save Store Settings
  const handleSaveStoreSettings = async (formData) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'บันทึกข้อมูลไม่สำเร็จ');
    }
    const data = await res.json();
    if (data?.settings) {
      setStoreSettings(data.settings);
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchAccountingData();
    fetchTaxData();
    fetchStoreSettings();
  }, []);

  // Electron Auto-Updater Lifecycle
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getVersion().then((info) => {
        if (info?.version) {
          setAppVersion(info.version);
          setUpdateState((prev) => ({
            ...prev,
            currentVersion: info.version,
            isPackaged: info.isPackaged
          }));
        }
      }).catch(() => {});

      const unsubscribe = window.electronAPI.onUpdateStatus((data) => {
        setUpdateState((prev) => ({
          ...prev,
          ...data
        }));
        if (['checking', 'available', 'downloading', 'downloaded', 'not-available', 'error'].includes(data.status)) {
          setIsUpdateModalOpen(true);
        }
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, []);

  const handleCheckForUpdates = async () => {
    setIsUpdateModalOpen(true);
    setUpdateState((prev) => ({
      ...prev,
      status: 'checking',
      percent: 0,
      message: ''
    }));

    if (window.electronAPI) {
      try {
        await window.electronAPI.checkForUpdates();
      } catch (err) {
        setUpdateState((prev) => ({
          ...prev,
          status: 'error',
          message: err.message
        }));
      }
    } else {
      // Running in web browser without Electron
      setTimeout(() => {
        setUpdateState((prev) => ({
          ...prev,
          status: 'not-available',
          message: 'ระบบอัปเดตอัตโนมัติรองรับเฉพาะการใช้งานผ่านโปรแกรม Desktop App (Pouch.exe)'
        }));
      }, 400);
    }
  };

  const handleRestartAndInstall = () => {
    if (window.electronAPI) {
      window.electronAPI.restartAndInstall();
    }
  };

  // Reload tax when year or period changes
  useEffect(() => {
    fetchTaxData();
  }, [taxYear, taxPeriod]);

  // Seed sample demo data
  const handleLoadSeedData = async () => {
    try {
      const res = await fetch('/api/system/seed', { method: 'POST' });
      if (res.ok) {
        showAlert('โหลดข้อมูลตัวอย่างสำเร็จ!', 'success', 'โหลดข้อมูลตัวอย่าง');
        fetchProducts();
        fetchAccountingData();
        fetchTaxData();
      } else {
        showAlert('เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง', 'error');
      }
    } catch (err) {
      showAlert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (!window.confirm('คำเตือน: คุณต้องการล้างข้อมูลสินค้า ประวัติการขาย และบัญชีทั้งหมดในระบบหรือไม่?')) return;
    try {
      const res = await fetch('/api/system/clear', { method: 'POST' });
      if (res.ok) {
        showAlert('ล้างฐานข้อมูลเรียบร้อยแล้ว', 'success', 'ล้างข้อมูลระบบ');
        setCart([]);
        fetchProducts();
        fetchAccountingData();
        fetchTaxData();
      }
    } catch (err) {
      showAlert('ไม่สามารถล้างข้อมูลได้', 'error');
    }
  };

  // Global Barcode Scanner Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        if (buffer.length >= 3) {
          const scannedCode = buffer.trim();
          handleScannedBarcode(scannedCode);
          buffer = '';
        }
      } else {
        const char = getCharFromKeyEvent(e);
        if (char && char.length === 1) {
          buffer += char;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart]);

  const handleScannedBarcode = (barcode) => {
    const rawBarcode = (barcode || '').trim();
    const cleanBarcode = normalizeBarcode(rawBarcode);
    const product = products.find(p =>
      p.barcode === cleanBarcode ||
      (p.barcode && normalizeBarcode(p.barcode) === cleanBarcode) ||
      p.barcode === rawBarcode
    );
    if (product) {
      playBeep();
      addToCart(product);
    } else {
      showAlert(
        `ไม่พบสินค้าที่มีบาร์โค้ด: ${cleanBarcode}`,
        'warning',
        'ไม่พบบาร์โค้ดสินค้า',
        rawBarcode !== cleanBarcode ? `รหัสสแกนไทย: ${rawBarcode} → แปลงเป็น: ${cleanBarcode}` : ''
      );
    }
  };

  // Cart Operations
  const addToCart = (product) => {
    if (product.stock_qty <= 0) {
      showAlert(`สินค้า "${product.name}" หมดสต็อก!`, 'warning', 'สินค้าหมดสต็อก');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_qty) {
          showAlert(`สินค้ามีในสต็อกเพียง ${product.stock_qty} ชิ้น`, 'warning', 'สต็อกไม่เพียงพอ');
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: Number(((item.quantity + 1) * item.unit_price).toFixed(2)) }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          unit_price: product.sell_price,
          unit_cost: product.cost_price || 0,
          quantity: 1,
          subtotal: Number(product.sell_price.toFixed(2)),
          image_url: product.image_url
        }
      ];
    });
  };

  const updateCartQty = (productId, delta) => {
    const prod = products.find(p => p.id === productId);
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product_id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (prod && newQty > prod.stock_qty) {
              showAlert(`สต็อกมีเพียง ${prod.stock_qty} ชิ้น`, 'warning', 'สต็อกไม่เพียงพอ');
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              subtotal: Number((newQty * item.unit_price).toFixed(2))
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived('');
  };

  // Checkout Submission (Direct checkout & optional cash tender calculation)
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      showAlert('ตะกร้าว่างเปล่า กรุณาเพิ่มสินค้าก่อนคิดเงิน', 'warning', 'ตะกร้าว่าง');
      return;
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const parsedCash = parseFloat(cashReceived);
    const cashVal = !isNaN(parsedCash) && parsedCash >= totalAmount ? parsedCash : totalAmount;
    const changeVal = cashVal - totalAmount;

    const payload = {
      items: cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: item.unit_cost,
        subtotal: item.subtotal
      })),
      total_amount: totalAmount,
      payment_method: 'เงินสด',
      cash_received: cashVal,
      change_amount: changeVal
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'การคิดเงินล้มเหลว');
      }

      const orderData = await res.json();
      setCompletedOrder(orderData);
      clearCart();
      fetchProducts();
      fetchAccountingData();
      fetchTaxData();
    } catch (err) {
      showAlert(`เกิดข้อผิดพลาดในการคิดเงิน: ${err.message}`, 'error', 'คิดเงินไม่สำเร็จ');
    }
  };

  // Product Modal Controls
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      barcode: '',
      category: 'ทั่วไป',
      pack_count: '1',
      pack_cost: '',
      pack_qty: '',
      cost_price: '',
      profit_margin: '',
      sell_price: '',
      stock_qty: '',
      min_stock: '5'
    });
    setImageFile(null);
    setImagePreview('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category || 'ทั่วไป',
      pack_count: '1',
      pack_cost: '',
      pack_qty: '',
      cost_price: product.cost_price?.toString() || '',
      profit_margin: ((product.sell_price || 0) - (product.cost_price || 0)).toFixed(2),
      sell_price: product.sell_price?.toString() || '',
      stock_qty: product.stock_qty?.toString() || '0',
      min_stock: product.min_stock?.toString() || '5'
    });
    setImageFile(null);
    setImagePreview(product.image_url || '');
    setIsProductModalOpen(true);
  };

  // Smart Pricing Cost Calculation (Supports Multi-Pack)
  const handleCostCalculation = (field, val) => {
    const updated = { ...productForm, [field]: val };

    const packCount = parseFloat(updated.pack_count) || 1;
    const packCost = parseFloat(updated.pack_cost);
    const packQty = parseFloat(updated.pack_qty);

    if (field === 'pack_cost' || field === 'pack_qty' || field === 'pack_count') {
      if (packCost > 0 && packQty > 0) {
        const unitCost = Number((packCost / packQty).toFixed(2));
        updated.cost_price = unitCost.toString();

        if (packCount > 0 && (!updated.stock_qty || updated.stock_qty === '0')) {
          updated.stock_qty = (packCount * packQty).toString();
        }

        if (updated.profit_margin !== '') {
          const margin = parseFloat(updated.profit_margin) || 0;
          updated.sell_price = (unitCost + margin).toFixed(2);
        } else if (updated.sell_price !== '') {
          const sell = parseFloat(updated.sell_price) || 0;
          updated.profit_margin = (sell - unitCost).toFixed(2);
        }
      }
    } else if (field === 'cost_price') {
      const cost = parseFloat(val) || 0;
      if (updated.profit_margin !== '') {
        const margin = parseFloat(updated.profit_margin) || 0;
        updated.sell_price = (cost + margin).toFixed(2);
      } else if (updated.sell_price !== '') {
        const sell = parseFloat(updated.sell_price) || 0;
        updated.profit_margin = (sell - cost).toFixed(2);
      }
    } else if (field === 'profit_margin') {
      const cost = parseFloat(updated.cost_price) || 0;
      const margin = parseFloat(val) || 0;
      updated.sell_price = (cost + margin).toFixed(2);
    } else if (field === 'sell_price') {
      const cost = parseFloat(updated.cost_price) || 0;
      const sell = parseFloat(val) || 0;
      updated.profit_margin = (sell - cost).toFixed(2);
    }

    setProductForm(updated);
  };

  // Generate Unique Barcode
  const handleAutoGenerateBarcode = () => {
    const randomSuffix = Math.floor(10000000 + Math.random() * 90000000);
    const newBarcode = `885${randomSuffix}`;
    setProductForm(prev => ({ ...prev, barcode: newBarcode }));
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('barcode', productForm.barcode || '');
      formData.append('category', productForm.category || 'ทั่วไป');
      formData.append('cost_price', productForm.cost_price || 0);
      formData.append('sell_price', productForm.sell_price || 0);
      formData.append('stock_qty', productForm.stock_qty || 0);
      formData.append('min_stock', productForm.min_stock || 0);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      let res;
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: formData
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          body: formData
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'บันทึกสินค้าไม่สำเร็จ');
      }

      setIsProductModalOpen(false);
      fetchProducts();
      fetchAccountingData();
    } catch (err) {
      showAlert(`ข้อผิดพลาด: ${err.message}`, 'error', 'บันทึกสินค้าไม่สำเร็จ');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบสินค้านี้ออกจากระบบหรือไม่?')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
        fetchAccountingData();
      } else {
        showAlert('ไม่สามารถลบสินค้าได้', 'error');
      }
    } catch (err) {
      showAlert('เกิดข้อผิดพลาดในการลบสินค้า', 'error');
    }
  };

  // Restock Modal
  const openRestockModal = (product) => {
    setRestockProduct(product);
    setRestockForm({
      add_qty: '',
      batch_cost: product.cost_price?.toString() || '',
      update_cost_price: true,
      note: 'เติมสต็อกสินค้า'
    });
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct) return;

    try {
      const res = await fetch(`/api/products/${restockProduct.id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          add_qty: parseInt(restockForm.add_qty, 10),
          batch_cost: restockForm.batch_cost ? parseFloat(restockForm.batch_cost) : undefined,
          update_cost_price: restockForm.update_cost_price,
          note: restockForm.note
        })
      });

      if (!res.ok) throw new Error('เติมสต็อกไม่สำเร็จ');

      setIsRestockModalOpen(false);
      fetchProducts();
      fetchAccountingData();
    } catch (err) {
      showAlert(`ข้อผิดพลาด: ${err.message}`, 'error', 'เติมสต็อกไม่สำเร็จ');
    }
  };

  // Barcode Modal
  const openBarcodeModal = (product) => {
    setBarcodeModalProduct(product);
    setPrintCopies(product.stock_qty > 0 ? product.stock_qty : 30);
    setIsBarcodeModalOpen(true);
  };

  // Expense Handlers
  const handleSaveExpense = async (expenseData) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      if (res.ok) {
        fetchTaxData();
        fetchAccountingData();
      }
    } catch (err) {
      showAlert('ไม่สามารถบันทึกค่าใช้จ่ายได้', 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('คุณต้องการลบรายการค่าใช้จ่ายนี้หรือไม่?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTaxData();
        fetchAccountingData();
      }
    } catch (err) {
      showAlert('ไม่สามารถลบค่าใช้จ่ายได้', 'error');
    }
  };

  // Export Tax Por Sor 10 CSV
  const handleExportTaxCsv = () => {
    if (!taxCashFlow?.rows || taxCashFlow.rows.length === 0) {
      showAlert('ไม่มีข้อมูลเงินสดรับจ่ายเพื่อส่งออก', 'info');
      return;
    }
    const headers = ['ลำดับ', 'วัน/เดือน/ปี', 'รายการ / คำอธิบาย', 'เลขที่เอกสารอ้างอิง', 'เงินสดรับ (บาท)', 'เงินสดจ่าย (บาท)', 'คงเหลือ (บาท)', 'หมายเหตุ'];
    const rows = taxCashFlow.rows.map(r => [
      r.id,
      r.date,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.ref_no || ''}"`,
      (r.cash_in || 0).toFixed(2),
      (r.cash_out || 0).toFixed(2),
      (r.balance || 0).toFixed(2),
      `"${r.note || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานเงินสดรับจ่าย_สรรพากร_ปส10_${taxYear}_${taxPeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Categories list
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category || 'ทั่วไป')))];

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#F7F6F2] text-[#181A18] antialiased font-['Prompt',sans-serif]">
      {/* 1. LEFT SIDEBAR NAVIGATION */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        taxSummary={taxSummary}
        cartCount={cart.length}
        orderHistoryCount={orderHistory.length}
        onLoadSeed={handleLoadSeedData}
        onClearData={handleClearAllData}
        appVersion={appVersion}
        onCheckUpdate={handleCheckForUpdates}
        isCheckingUpdate={updateState.status === 'checking'}
        storeSettings={storeSettings}
        onOpenStoreSettings={() => setIsStoreSettingsOpen(true)}
      />

      {/* 2. RIGHT MAIN CONTENT COLUMN */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* MAIN WORKSPACE */}
        <main className="flex-1 min-h-0 overflow-y-auto bg-[#F7F6F2] flex flex-col">
          {activeTab === 'pos' && (
            <CashierTab
              products={products}
              cart={cart}
              addToCart={addToCart}
              updateCartQty={updateCartQty}
              removeFromCart={removeFromCart}
              clearCart={clearCart}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              cashReceived={cashReceived}
              setCashReceived={setCashReceived}
              onCheckout={handleCheckoutSubmit}
              onOpenAddProduct={() => openAddProductModal()}
              storeSettings={storeSettings}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              products={products}
              onOpenAddProduct={openAddProductModal}
              onOpenEditProduct={openEditProductModal}
              onDeleteProduct={handleDeleteProduct}
              onOpenRestock={openRestockModal}
              onOpenBarcode={openBarcodeModal}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'accounting' && (
            <AnalyticsTab
              orderHistory={orderHistory}
              stockLogs={stockLogs}
              products={products}
              expenses={expenses}
              reportTimeframe={reportTimeframe}
              setReportTimeframe={setReportTimeframe}
              onViewReceipt={(ord) => setSelectedReceiptOrder(ord)}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'receipts' && (
            <ReceiptsTab
              orderHistory={orderHistory}
              onPrintThermal={(ord) => setSelectedReceiptOrder(ord)}
              storeSettings={storeSettings}
              showAlert={showAlert}
            />
          )}

          {activeTab === 'tax' && (
            <TaxTab
              taxSummary={taxSummary}
              taxCashFlow={taxCashFlow}
              taxYear={taxYear}
              setTaxYear={setTaxYear}
              taxPeriod={taxPeriod}
              setTaxPeriod={setTaxPeriod}
              expenses={expenses}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              onExportCsv={handleExportTaxCsv}
              showAlert={showAlert}
            />
          )}
        </main>
      </div>

      {/* 3. MODALS */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        onSaveProduct={handleSaveProduct}
        imagePreview={imagePreview}
        setImagePreview={setImagePreview}
        setImageFile={setImageFile}
        onAutoGenerateBarcode={handleAutoGenerateBarcode}
        onCostCalculation={handleCostCalculation}
        existingCategories={categories}
      />

      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        product={restockProduct}
        restockForm={restockForm}
        setRestockForm={setRestockForm}
        onSubmitRestock={handleRestockSubmit}
      />

      <BarcodeModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        product={barcodeModalProduct}
        printCopies={printCopies}
        setPrintCopies={setPrintCopies}
      />

      <ReceiptModal
        order={completedOrder || selectedReceiptOrder}
        onClose={() => {
          setCompletedOrder(null);
          setSelectedReceiptOrder(null);
        }}
        storeSettings={storeSettings}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateState={updateState}
        onRestart={handleRestartAndInstall}
        onCheckAgain={handleCheckForUpdates}
      />

      <StoreSettingsModal
        isOpen={isStoreSettingsOpen}
        onClose={() => setIsStoreSettingsOpen(false)}
        settings={storeSettings}
        onSaveSettings={handleSaveStoreSettings}
        showAlert={showAlert}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        detail={alertModal.detail}
        storeSettings={storeSettings}
      />
    </div>
  );
}
