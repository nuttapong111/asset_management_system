'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Asset } from '@/types/asset';
import { Maintenance } from '@/types/maintenance';
import { Contract } from '@/types/contract';
import { Payment } from '@/types/finance';
import { formatCurrency, getStatusText } from '@/lib/utils';
import { Card, CardBody, Button } from '@heroui/react';
import { XMarkIcon, ChartBarIcon, PlusIcon, PencilIcon, BuildingOfficeIcon, ArrowDownTrayIcon, PhotoIcon, MagnifyingGlassIcon, FunnelIcon, DocumentTextIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { exportDocument } from '@/lib/documentExport';
import { showContractForm } from '@/lib/contractForm';
import { showAssetForm } from '@/lib/assetForm';
import { showCreateUnitsForm } from '@/lib/createUnitsForm';
import { showTenantForm, showTenantDetail } from '@/lib/tenantForm';
import { generateContractDocument } from '@/lib/contractDocument';
import { exportPaymentsToExcel, exportPaymentsToPDF } from '@/lib/paymentExport';
import { generateReceiptDocument } from '@/lib/receiptDocument';
import Swal from 'sweetalert2';

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Tooltip = dynamic(
  () => import('react-leaflet').then((mod) => mod.Tooltip),
  { ssr: false }
);

const ZoomControl = dynamic(
      () => import('react-leaflet').then((mod) => mod.ZoomControl),
      { ssr: false }
    );

const MapClickHandler = dynamic(
  () => import('./MapClickHandler'),
  { ssr: false }
);

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface DashboardMapComponentProps {
  assets: Asset[];
  stats: {
    totalAssets: number;
    totalContracts: number;
    totalIncome: number;
    pendingMaintenance: number;
    assetsByType: {
      house: number;
      condo: number;
      apartment: number;
      land: number;
    };
    assetsByStatus: {
      available: number;
      rented: number;
      maintenance: number;
    };
    paidCount: number;
    overdueCount: number;
    monthlyIncome: number;
    collectedThisMonth: number;
    overdueAmount: number;
  };
  statCards: StatCard[];
  maintenance: Maintenance[];
}

export default function DashboardMapComponent({ assets, stats, statCards, maintenance }: DashboardMapComponentProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'tenant' | 'general'>('tenant');
  const [documentType, setDocumentType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'lease' | 'payment' | 'maintenance' | 'units' | 'documents'>('details');
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null); // QR code for payment
  const [assetsRefreshKey, setAssetsRefreshKey] = useState(0);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<{
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }>({});
  const [assetFilters, setAssetFilters] = useState<{
    status?: Asset['status'][];
    type?: Asset['type'][];
    searchText?: string;
    paymentStatus?: ('paid' | 'overdue' | 'pending' | 'no_contract')[];
  }>({
    status: ['available', 'rented', 'maintenance'],
    type: ['house', 'condo', 'apartment', 'land'],
    paymentStatus: ['paid', 'overdue', 'pending', 'no_contract'],
    searchText: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [tempProofImages, setTempProofImages] = useState<string[]>([]); // Temporary proof images before confirmation
  const [paymentsRefreshKey, setPaymentsRefreshKey] = useState(0);
  const [contractsRefreshKey, setContractsRefreshKey] = useState(0);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const user = getStoredUser();

  // Helper functions using API data
  const getChildAssets = (parentAssetId: string): Asset[] => {
    return allAssets.filter((a: Asset) => a.parentAssetId === parentAssetId);
  };

  const getOccupancyRate = (parentAssetId: string): number => {
    const parentAsset = allAssets.find((a: Asset) => a.id === parentAssetId);
    if (!parentAsset || !parentAsset.isParent || !parentAsset.totalUnits || parentAsset.totalUnits === 0) {
      return 0;
    }
    const childAssets = getChildAssets(parentAssetId);
    const rentedCount = childAssets.filter((a: Asset) => a.status === 'rented').length;
    return (rentedCount / parentAsset.totalUnits) * 100;
  };

  const getTotalIncomeFromParent = (parentAssetId: string): number => {
    const parentAsset = allAssets.find((a: Asset) => a.id === parentAssetId);
    if (!parentAsset) return 0;
    const childAssets = getChildAssets(parentAssetId);
    const allAssetIds = [parentAssetId, ...childAssets.map((a: Asset) => a.id)];
    const contracts = allContracts.filter((c: Contract) => 
      allAssetIds.includes(c.assetId) && c.status === 'active'
    );
    return contracts.reduce((sum: number, contract: Contract) => sum + contract.rentAmount, 0);
  };

  useEffect(() => {
    setIsClient(true);
    
    // Load QR code from localStorage
    const storedQrCode = localStorage.getItem('payment_qr_code');
    if (storedQrCode) {
      setQrCodeImage(storedQrCode);
    }
  }, []);

  // Track if initial load has completed and current user ID
  const hasInitialLoadedRef = useRef(false);
  const currentUserIdRef = useRef<string | null>(null);

  // Load data from API - only when user changes or on mount
  useEffect(() => {
    // Skip if already loaded for this user
    if (hasInitialLoadedRef.current && currentUserIdRef.current === user?.id) {
      return;
    }
    
    // Reset if user changed
    if (currentUserIdRef.current !== user?.id) {
      hasInitialLoadedRef.current = false;
      currentUserIdRef.current = user?.id || null;
    }
    
    if (!user) {
      setLoadingData(false);
      return;
    }
    
    const loadData = async () => {
      try {
        const token = getStoredToken();
        if (!token || !user) return;
        
        apiClient.setToken(token);
        
        // Load all data in parallel
        const [assetsData, contractsData, paymentsData, usersData] = await Promise.all([
          apiClient.getAssets(),
          apiClient.getContracts(),
          apiClient.getPayments(),
          (user.role === 'admin' || user.role === 'owner') ? apiClient.getUsers() : Promise.resolve([]),
        ]);
        
        setAllAssets(assetsData);
        setAllContracts(contractsData);
        setAllPayments(paymentsData);
        setAllUsers(usersData);
        setLoadingData(false);
        hasInitialLoadedRef.current = true;
        currentUserIdRef.current = user.id;
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadingData(false);
      }
    };

    loadData();
  }, [user?.id]); // Only depend on user.id, not the whole user object

  // Track previous refresh keys to avoid unnecessary API calls
  const prevRefreshKeysRef = useRef({ assets: 0, contracts: 0, payments: 0 });
  const isRefreshingRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);

  // Refresh data when refresh keys change (but debounce to avoid too many calls)
  useEffect(() => {
    // Only refresh if initial load is complete
    if (!user || !hasInitialLoadedRef.current) return;
    
    // Check if refresh keys actually changed
    const keysChanged = 
      prevRefreshKeysRef.current.assets !== assetsRefreshKey ||
      prevRefreshKeysRef.current.contracts !== contractsRefreshKey ||
      prevRefreshKeysRef.current.payments !== paymentsRefreshKey;
    
    // Skip if no keys changed or all are 0 (initial state)
    if (!keysChanged || (assetsRefreshKey === 0 && contractsRefreshKey === 0 && paymentsRefreshKey === 0)) {
      return;
    }
    
    // Skip if already refreshing
    if (isRefreshingRef.current) return;
    
    // Prevent too frequent refreshes (minimum 2 seconds between refreshes)
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < 2000) {
      return;
    }
    
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Update previous keys immediately to prevent duplicate calls
    prevRefreshKeysRef.current = {
      assets: assetsRefreshKey,
      contracts: contractsRefreshKey,
      payments: paymentsRefreshKey,
    };
    
    const loadData = async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;
      lastRefreshTimeRef.current = Date.now();
      
      try {
        const token = getStoredToken();
        if (!token) {
          isRefreshingRef.current = false;
          return;
        }
        
        apiClient.setToken(token);
        
        // Load all data in parallel
        const [assetsData, contractsData, paymentsData, usersData] = await Promise.all([
          apiClient.getAssets(),
          apiClient.getContracts(),
          apiClient.getPayments(),
          (user.role === 'admin' || user.role === 'owner') ? apiClient.getUsers() : Promise.resolve([]),
        ]);
        
        setAllAssets(assetsData);
        setAllContracts(contractsData);
        setAllPayments(paymentsData);
        setAllUsers(usersData);
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Debounce: wait 1500ms before refreshing to avoid too many calls
    refreshTimeoutRef.current = setTimeout(() => {
      loadData();
    }, 1500);
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [user?.id, assetsRefreshKey, contractsRefreshKey, paymentsRefreshKey]); // Remove loadingData from dependencies

  // Initialize filters when filter modal is opened for the first time (if not already initialized)
  useEffect(() => {
    if (showFilterModal && !assetFilters.status && !assetFilters.type && !assetFilters.paymentStatus) {
      // Set all options as selected (like "all" is checked)
      setAssetFilters({
        status: ['available', 'rented', 'maintenance'],
        type: ['house', 'condo', 'apartment', 'land'],
        paymentStatus: ['paid', 'overdue', 'pending', 'no_contract'],
        searchText: '',
      });
    }
  }, [showFilterModal]);

  // Filter assets with location - refresh when assetsRefreshKey changes
  const assetsWithLocation = useMemo(() => {
    // Check if any filter is selected
    const hasStatusFilter = assetFilters.status && assetFilters.status.length > 0;
    const hasTypeFilter = assetFilters.type && assetFilters.type.length > 0;
    const hasPaymentStatusFilter = assetFilters.paymentStatus && assetFilters.paymentStatus.length > 0;
    const hasSearchText = assetFilters.searchText && assetFilters.searchText.trim().length > 0;
    
    // If no filter is selected at all, return empty array (don't show any data)
    if (!hasStatusFilter && !hasTypeFilter && !hasPaymentStatusFilter && !hasSearchText) {
      return [];
    }
    
    // Get fresh assets from API data
    let freshAssets = allAssets.filter((asset: Asset) => {
      if (user?.role === 'owner') {
        return asset.ownerId === user.id;
      }
      if (user?.role === 'tenant') {
        // For tenants, only show assets they are renting
        const tenantContracts = allContracts.filter((c: Contract) => c.tenantId === user.id && c.status === 'active');
        const tenantAssetIds = tenantContracts.map((c: Contract) => c.assetId);
        // Also check child assets if this is a parent asset
        const childAssetIds = tenantContracts
          .map((c: Contract) => {
            const contractAsset = allAssets.find((a: Asset) => a.id === c.assetId);
            return contractAsset?.parentAssetId;
          })
          .filter((id: any) => id !== undefined) as string[];
        return tenantAssetIds.includes(asset.id) || childAssetIds.includes(asset.id) || (asset.isParent && asset.childAssets?.some((childId: string) => tenantAssetIds.includes(childId)));
      }
      return true;
    });
    
    // Apply filters (only if filters are set and not all options are selected)
    if (assetFilters.status && assetFilters.status.length > 0) {
      const allStatuses: Asset['status'][] = ['available', 'rented', 'maintenance'];
      const isAllSelected = assetFilters.status.length === allStatuses.length && 
        allStatuses.every(s => assetFilters.status!.includes(s));
      if (!isAllSelected) {
        freshAssets = freshAssets.filter(asset => assetFilters.status!.includes(asset.status));
      }
    }
    if (assetFilters.type && assetFilters.type.length > 0) {
      const allTypes: Asset['type'][] = ['house', 'condo', 'apartment', 'land'];
      const isAllSelected = assetFilters.type.length === allTypes.length && 
        allTypes.every(t => assetFilters.type!.includes(t));
      if (!isAllSelected) {
        freshAssets = freshAssets.filter(asset => assetFilters.type!.includes(asset.type));
      }
    }
    if (assetFilters.searchText) {
      const searchLower = assetFilters.searchText.toLowerCase();
      freshAssets = freshAssets.filter(asset => 
        asset.name.toLowerCase().includes(searchLower) ||
        asset.address.toLowerCase().includes(searchLower) ||
        asset.district.toLowerCase().includes(searchLower) ||
        asset.province.toLowerCase().includes(searchLower) ||
        (asset.unitNumber && asset.unitNumber.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by payment status (only if filters are set and not all options are selected)
    if (assetFilters.paymentStatus && assetFilters.paymentStatus.length > 0) {
      const allPaymentStatuses: ('paid' | 'overdue' | 'pending' | 'no_contract')[] = ['paid', 'overdue', 'pending', 'no_contract'];
      const isAllSelected = assetFilters.paymentStatus.length === allPaymentStatuses.length && 
        allPaymentStatuses.every(p => assetFilters.paymentStatus!.includes(p));
      if (isAllSelected) {
        // Skip payment status filter if all are selected
      } else {
        freshAssets = freshAssets.filter(asset => {
        // Get contracts for this asset
        const assetContracts = allContracts.filter((c: Contract) => {
          if (asset.isParent && asset.childAssets) {
            return asset.childAssets.includes(c.assetId) || c.assetId === asset.id;
          }
          return c.assetId === asset.id;
        });
        
        // If no contracts, check if "no_contract" is in filter
        if (assetContracts.length === 0) {
          return assetFilters.paymentStatus!.includes('no_contract');
        }
        
        // Get all payments for these contracts
        const contractIds = assetContracts.map(c => c.id);
        const payments = allPayments.filter((p: Payment) => contractIds.includes(p.contractId));
        
        if (payments.length === 0) {
          return assetFilters.paymentStatus!.includes('no_contract');
        }
        
        // Check payment statuses
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const hasOverdue = payments.some(p => {
          if (p.status === 'overdue') return true;
          if (p.status === 'pending') {
            const dueDate = new Date(p.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate < today;
          }
          return false;
        });
        
        const hasPending = payments.some(p => {
          if (p.status === 'pending') {
            const dueDate = new Date(p.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate >= today;
          }
          return false;
        });
        
        const hasPaid = payments.some(p => p.status === 'paid');
        
        // Check if asset matches any of the selected payment statuses
        if (assetFilters.paymentStatus!.includes('overdue') && hasOverdue) return true;
        if (assetFilters.paymentStatus!.includes('pending') && hasPending) return true;
        if (assetFilters.paymentStatus!.includes('paid') && hasPaid && !hasOverdue && !hasPending) return true;
        
        return false;
        });
      }
    }
    
    // Filter assets with location
    const assetsWithCoords = freshAssets.filter(asset => asset.latitude && asset.longitude);
    
    // For hierarchical structure: show parent assets, but hide child assets that have the same location as parent
    // This prevents duplicate markers at the same location
    const parentAssetIds = new Set(
      assetsWithCoords
        .filter(a => a.isParent)
        .map(a => a.id)
    );
    
    return assetsWithCoords.filter(asset => {
      // Show parent assets
      if (asset.isParent) return true;
      
      // Show child assets only if parent doesn't exist or has different location
      if (asset.parentAssetId) {
        const parent = assetsWithCoords.find(a => a.id === asset.parentAssetId);
        if (parent) {
          // If parent and child have same location, hide child (show only parent)
          const sameLocation = 
            parent.latitude === asset.latitude && 
            parent.longitude === asset.longitude;
          return !sameLocation;
        }
      }
      
      // Show non-child assets
      return true;
    });
  }, [allAssets, allContracts, allPayments, assetsRefreshKey, user, assetFilters]);

  // Get map bounds
  const mapBounds = useMemo(() => {
    if (assetsWithLocation.length === 0) {
      return [[13.7563, 100.5018]] as [[number, number]];
    }
    return assetsWithLocation.map(asset => [asset.latitude!, asset.longitude!]) as [[number, number]];
  }, [assetsWithLocation]);

  // Adjust zoom controls position when sidebars are open
  useEffect(() => {
    if (typeof window === 'undefined' || !isClient) return;

    const style = document.createElement('style');
    style.id = 'leaflet-zoom-control-adjust';
    style.textContent = `
      .leaflet-top.leaflet-left {
        left: ${selectedAsset ? '33rem' : '10px'} !important;
        transition: left 0.3s ease;
      }
      .leaflet-top.leaflet-right {
        right: ${showStatsModal || showFilterModal || showDocumentModal || showSettingsModal ? '32rem' : '10px'} !important;
        transition: right 0.3s ease;
      }
    `;
    
    const existingStyle = document.getElementById('leaflet-zoom-control-adjust');
    if (existingStyle) {
      existingStyle.remove();
    }
    document.head.appendChild(style);

    return () => {
      const styleToRemove = document.getElementById('leaflet-zoom-control-adjust');
      if (styleToRemove) {
        styleToRemove.remove();
      }
    };
  }, [selectedAsset, showStatsModal, showFilterModal, showDocumentModal, showSettingsModal, isClient]);

  // Listen for notification click events to open payment detail
  useEffect(() => {
    const handleOpenPaymentDetail = async (event: CustomEvent) => {
      const { paymentId } = event.detail;
      if (!paymentId) return;

      try {
        // Find payment
        const payment = allPayments.find((p: Payment) => p.id === paymentId);
        if (!payment) {
          // Reload payments if not found
          const token = getStoredToken();
          if (!token) return;
          apiClient.setToken(token);
          const paymentsData = await apiClient.getPayments();
          setAllPayments(paymentsData);
          
          const foundPayment = paymentsData.find((p: Payment) => p.id === paymentId);
          if (!foundPayment) return;
          
          // Find contract and asset
          const contract = allContracts.find((c: Contract) => c.id === foundPayment.contractId);
          if (!contract) return;
          
          const asset = allAssets.find((a: Asset) => a.id === contract.assetId);
          if (!asset) return;
          
          // Open asset sidebar and payment detail
          setSelectedAsset(asset);
          setActiveTab('payment');
          setSelectedPayment(foundPayment);
          setTempProofImages([]);
        } else {
          // Find contract and asset
          const contract = allContracts.find((c: Contract) => c.id === payment.contractId);
          if (!contract) return;
          
          const asset = allAssets.find((a: Asset) => a.id === contract.assetId);
          if (!asset) return;
          
          // Open asset sidebar and payment detail
          setSelectedAsset(asset);
          setActiveTab('payment');
          setSelectedPayment(payment);
          setTempProofImages([]);
        }
      } catch (error) {
        console.error('Error opening payment detail:', error);
      }
    };

    window.addEventListener('openPaymentDetail', handleOpenPaymentDetail as EventListener);
    return () => {
      window.removeEventListener('openPaymentDetail', handleOpenPaymentDetail as EventListener);
    };
  }, [allPayments, allContracts, allAssets]);

  // Check if asset has active maintenance requests
  const hasActiveMaintenance = (assetId: string): boolean => {
    return maintenance.some(m => 
      m.assetId === assetId && 
      (m.status === 'pending' || m.status === 'in_progress')
    );
  };

  // Get related data for selected asset
  const assetContracts = useMemo(() => {
    if (!selectedAsset) return [];
    
    // If parent asset, get contracts from all child assets
    if (selectedAsset.isParent && selectedAsset.childAssets) {
      const allAssetIds = [selectedAsset.id, ...selectedAsset.childAssets];
      return allContracts.filter((c: Contract) => allAssetIds.includes(c.assetId));
    }
    
    // For regular assets or child assets, get contracts for this asset only
    return allContracts.filter((c: Contract) => c.assetId === selectedAsset.id);
  }, [selectedAsset, contractsRefreshKey]);

  const assetPayments = useMemo(() => {
    if (!selectedAsset) return [];
    const contractIds = assetContracts.map(c => c.id);
    let payments = allPayments.filter((p: Payment) => contractIds.includes(p.contractId));
    
    // Apply filters
    if (paymentFilters.status) {
      payments = payments.filter(p => p.status === paymentFilters.status);
    }
    if (paymentFilters.type) {
      payments = payments.filter(p => p.type === paymentFilters.type);
    }
    if (paymentFilters.dateFrom) {
      payments = payments.filter(p => p.dueDate >= paymentFilters.dateFrom!);
    }
    if (paymentFilters.dateTo) {
      payments = payments.filter(p => p.dueDate <= paymentFilters.dateTo!);
    }
    
    return payments;
  }, [selectedAsset, assetContracts, paymentFilters, paymentsRefreshKey]);

  const assetMaintenance = useMemo(() => {
    if (!selectedAsset) return [];
    return maintenance.filter(m => m.assetId === selectedAsset.id);
  }, [selectedAsset, maintenance]);

  const childAssets = useMemo(() => {
    if (!selectedAsset || !selectedAsset.isParent) {
      return [];
    }
    const children = allAssets.filter((a: Asset) => a.parentAssetId === selectedAsset.id);
    // Debug logging
    console.log('Child Assets Debug:', {
      selectedAssetId: selectedAsset.id,
      selectedAssetName: selectedAsset.name,
      selectedAssetIsParent: selectedAsset.isParent,
      selectedAssetChildAssets: selectedAsset.childAssets,
      childAssetsCount: children.length,
      childAssets: children.map(c => ({ id: c.id, name: c.name, unitNumber: c.unitNumber, parentAssetId: c.parentAssetId }))
    });
    return children;
  }, [selectedAsset, assetsRefreshKey]);

  const handleCreateUnits = async () => {
    if (!selectedAsset || !selectedAsset.isParent) return;
    
    const result = await showCreateUnitsForm(selectedAsset);
    if (result) {
      setAssetsRefreshKey(prev => prev + 1);
      // Refresh selected asset
      const updatedAsset = allAssets.find((a: Asset) => a.id === selectedAsset.id);
      if (updatedAsset) {
        setSelectedAsset(updatedAsset);
      }
    }
  };

  const handleCreateContract = async () => {
    if (!selectedAsset) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกทรัพย์สิน',
        text: 'กรุณาคลิกที่ทรัพย์สินบนแผนที่ก่อนสร้างสัญญา',
      });
      return;
    }
    
    const result = await showContractForm(null, selectedAsset.id);
    if (result) {
      handleContractSuccess();
    }
  };

  const handleEditContract = async (contract: Contract) => {
    const result = await showContractForm(contract);
    if (result) {
      handleContractSuccess();
    }
  };

  const handleTerminateContract = async (contract: Contract) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการปิดการใช้งานสัญญา',
      text: `คุณต้องการปิดการใช้งานสัญญาเลขที่ ${contract.contractNumber || contract.id} หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: 'ใช่, ปิดการใช้งาน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    });

    if (result.isConfirmed) {
      try {
        const token = getStoredToken();
        if (!token) return;
        apiClient.setToken(token);
        
        await apiClient.updateContract(contract.id, { status: 'terminated' });
        await Swal.fire({
        icon: 'success',
        title: 'ปิดการใช้งานสัญญาเรียบร้อย',
        text: 'สัญญาถูกปิดการใช้งานแล้ว',
        timer: 2000,
        showConfirmButton: false,
      });
      // Force re-render contracts by updating refresh key
      setContractsRefreshKey(prev => prev + 1);
      } catch (error: any) {
        await Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: error.message || 'ไม่สามารถปิดการใช้งานสัญญาได้',
        });
      }
    }
  };

  const handleContractSuccess = async () => {
    // Force re-render contracts by updating refresh key
    setContractsRefreshKey(prev => prev + 1);
    // Refresh assets to update status
    setAssetsRefreshKey(prev => prev + 1);
    // Reload selected asset if exists
    if (selectedAsset) {
      try {
        const token = getStoredToken();
        if (token) {
          apiClient.setToken(token);
          const updatedAssets = await apiClient.getAssets();
          const updatedAsset = updatedAssets.find((a: Asset) => a.id === selectedAsset.id);
          if (updatedAsset) {
            setSelectedAsset(updatedAsset);
          }
        }
      } catch (error) {
        console.error('Error refreshing asset:', error);
      }
    }
  };

  const handleEditAsset = async () => {
    if (!selectedAsset) return;
    
    const result = await showAssetForm(selectedAsset);
    if (result) {
      // Update selectedAsset with new data
      const updatedAsset = allAssets.find((a: Asset) => a.id === result.id);
      if (updatedAsset) {
        setSelectedAsset(updatedAsset);
        // Force re-render by updating refresh key
        setContractsRefreshKey(prev => prev + 1);
        setAssetsRefreshKey(prev => prev + 1);
      }
    }
  };

  const handleAddAsset = () => {
    // Enable location selection mode
    setIsSelectingLocation(true);
    setTempMarker(null);
    // Close any open sidebars
    setSelectedAsset(null);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!isSelectingLocation) return;

    // Set temporary marker
    setTempMarker({ lat, lng });
    
    // Disable location selection mode
    setIsSelectingLocation(false);

    // Open asset form with selected location
    const result = await showAssetForm(null, { lat, lng });
    if (result) {
      // Refresh assets list
      setAssetsRefreshKey(prev => prev + 1);
      // Optionally select the new asset
      const newAsset = allAssets.find((a: Asset) => a.id === result.id);
      if (newAsset) {
        setSelectedAsset(newAsset);
        setActiveTab('details');
      }
    } else {
      // User cancelled form, re-enable location selection
      setIsSelectingLocation(true);
    }
    
    // Clear temp marker after a delay
    setTimeout(() => setTempMarker(null), 1000);
  };

  const handleCancelLocationSelection = () => {
    setIsSelectingLocation(false);
    setTempMarker(null);
  };

  // Create custom icon function
  const createCustomIcon = (status: Asset['status'], assetId: string, isParent: boolean = false) => {
    if (typeof window === 'undefined' || !isClient) return null;
    
    // Use dynamic import to avoid SSR issues
    const L = require('leaflet');
    
    // Fix for default marker icons in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    
    const colors: Record<Asset['status'], string> = {
      available: 'green',
      rented: 'blue',
      maintenance: 'orange',
    };
    const color = colors[status] || 'gray';
    const hasMaintenance = hasActiveMaintenance(assetId);
    
    // Parent assets get a larger marker with different icon
    const markerSize = isParent ? 40 : 30;
    const iconSize = isParent ? 18 : 14;
    const badgeSize = isParent ? 22 : 18;

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="position: relative;">
          <div style="
            background-color: ${color};
            width: ${markerSize}px;
            height: ${markerSize}px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: ${isParent ? '4px' : '3px'} solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: ${iconSize}px;
            ">${isParent ? '🏗️' : '🏠'}</div>
          </div>
          ${hasMaintenance ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background-color: #f59e0b;
              width: ${badgeSize}px;
              height: ${badgeSize}px;
              border-radius: 50%;
              border: 2px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              z-index: 1000;
            ">
              <span style="
                color: white;
                font-size: ${isParent ? '12px' : '10px'};
                font-weight: bold;
              ">🔧</span>
            </div>
          ` : ''}
          ${isParent ? `
            <div style="
              position: absolute;
              bottom: -25px;
              left: 50%;
              transform: translateX(-50%);
              background-color: rgba(0, 0, 0, 0.7);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              z-index: 1000;
            ">ที่ดินหลัก</div>
          ` : ''}
        </div>
      `,
      iconSize: [markerSize, markerSize],
      iconAnchor: [markerSize / 2, markerSize],
      popupAnchor: [0, -markerSize],
    });
  };

  // Don't render map until client-side
  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full relative" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
        <MapContainer
          center={[13.7563, 100.5018]}
          zoom={11}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapClickHandler onClick={handleMapClick} enabled={isSelectingLocation} />
          
          {tempMarker && (
            <Marker
              position={[tempMarker.lat, tempMarker.lng]}
              icon={createCustomIcon('available', 'temp')}
            >
              <Tooltip permanent={true} direction="top">
                <div style={{ 
                  fontFamily: "'Sukhumvit Set', 'Noto Sans Thai', sans-serif", 
                  fontSize: '12px', 
                  fontWeight: 600 
                }}>
                  📍 ตำแหน่งที่เลือก
                </div>
              </Tooltip>
            </Marker>
          )}
          
          {assetsWithLocation.map((asset) => {
            const icon = createCustomIcon(asset.status, asset.id, asset.isParent);
            if (!icon) return null;
            
            const hasMaintenance = hasActiveMaintenance(asset.id);
            const maintenanceItems = maintenance.filter(m => 
              m.assetId === asset.id && 
              (m.status === 'pending' || m.status === 'in_progress')
            );
            
            // For parent assets, show total units in tooltip
            const tooltipText = asset.isParent && asset.totalUnits
              ? `${asset.name} (${asset.totalUnits} ห้อง)`
              : asset.name;
            
            return (
              <Marker
                key={asset.id}
                position={[asset.latitude!, asset.longitude!]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setSelectedAsset(asset);
                    setActiveTab('details'); // Reset to details tab when selecting new asset
                  },
                }}
              >
                <Tooltip permanent={false} direction="top" offset={[0, asset.isParent ? -15 : -10]}>
                  <div style={{ 
                    fontFamily: "'Sukhumvit Set', 'Noto Sans Thai', sans-serif", 
                    fontSize: asset.isParent ? '13px' : '12px', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexDirection: 'column'
                  }}>
                    <span>{tooltipText}</span>
                    {asset.isParent && asset.totalUnits && (
                      <span style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        fontWeight: 400
                      }}>
                        {getOccupancyRate(asset.id).toFixed(0)}% เช่าแล้ว
                      </span>
                    )}
                    {hasMaintenance && (
                      <span style={{
                        display: 'inline-block',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        whiteSpace: 'nowrap'
                      }}>🔧 มีรายการซ่อม</span>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend - Move based on which sidebar is open */}
        <div className={`absolute top-4 bg-white rounded-lg shadow-lg p-3 md:p-4 z-[1000] transition-all duration-300 ${
          (showStatsModal || showFilterModal || showDocumentModal || showSettingsModal) && selectedAsset 
            ? 'right-4 md:right-[28rem]' // Both sidebars open
            : (showStatsModal || showFilterModal || showDocumentModal || showSettingsModal)
            ? 'right-4 md:right-[32rem]' // Only right sidebar open
            : selectedAsset
            ? 'right-4' // Only left sidebar open
            : 'right-4' // No sidebars open
        }`}>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">สถานะทรัพย์สิน</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
              <span className="text-xs text-gray-700">ว่าง</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <span className="text-xs text-gray-700">ให้เช่าแล้ว</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
              <span className="text-xs text-gray-700">ซ่อมแซม</span>
            </div>
          </div>
        </div>

        {/* Location Selection Banner */}
        {isSelectingLocation && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 md:gap-4 text-sm md:text-base max-w-[90%]">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="font-semibold">คลิกบนแผนที่เพื่อเลือกตำแหน่งทรัพย์สิน</span>
            </div>
            <button
              onClick={handleCancelLocationSelection}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {/* Action Buttons - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 md:gap-3">
          {/* Settings Button - Only show for owner/admin */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <button
              onClick={() => {
                setShowSettingsModal(!showSettingsModal);
                if (!showSettingsModal) {
                  setShowDocumentModal(false);
                  setShowFilterModal(false);
                  setShowStatsModal(false);
                }
              }}
              className={`p-2 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-110 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center ${
                showSettingsModal 
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800' 
                  : 'bg-gradient-to-r from-gray-600 to-gray-700'
              } text-white`}
              title="การตั้งค่า"
            >
              <Cog6ToothIcon className="w-5 h-5 md:w-7 md:h-7" />
            </button>
          )}

          {/* Document Button - Only show for owner/admin */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <button
              onClick={() => {
                setShowDocumentModal(!showDocumentModal);
                if (!showDocumentModal) {
                  setShowSettingsModal(false);
                  setShowFilterModal(false);
                  setShowStatsModal(false);
                }
              }}
              className={`p-2 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-110 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center ${
                showDocumentModal 
                  ? 'bg-gradient-to-r from-indigo-700 to-purple-700' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600'
              } text-white`}
              title="เอกสารภาพรวม"
            >
              <DocumentTextIcon className="w-5 h-5 md:w-7 md:h-7" />
            </button>
          )}

          {/* Search/Filter Button */}
          <button
            onClick={() => {
              setShowFilterModal(!showFilterModal);
              if (!showFilterModal) {
                setShowDocumentModal(false);
                setShowSettingsModal(false);
                setShowStatsModal(false);
              }
            }}
            className={`p-2 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-110 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center ${
              showFilterModal 
                ? 'bg-gradient-to-r from-emerald-700 to-teal-700' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600'
            } text-white`}
            title="ค้นหา/กรองสินทรัพย์"
          >
            <MagnifyingGlassIcon className="w-5 h-5 md:w-7 md:h-7" />
          </button>

          {/* Add Asset Button */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <button
              onClick={handleAddAsset}
              className={`p-2 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-110 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center ${
                isSelectingLocation 
                  ? 'bg-gradient-to-r from-red-600 to-orange-600' 
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600'
              } text-white`}
              title={isSelectingLocation ? "ยกเลิกการเลือกตำแหน่ง" : "เพิ่มทรัพย์สินใหม่"}
            >
              {isSelectingLocation ? (
                <XMarkIcon className="w-5 h-5 md:w-7 md:h-7" />
              ) : (
                <PlusIcon className="w-5 h-5 md:w-7 md:h-7" />
              )}
            </button>
          )}
          
          {/* Stats Button - Only show for owner/admin */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
          <button
            onClick={() => setShowStatsModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 md:p-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-110 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center"
            title="ข้อมูลสรุปทั้งหมด"
          >
              <ChartBarIcon className="w-5 h-5 md:w-7 md:h-7" />
          </button>
          )}
        </div>
      </div>

      {/* Stats Summary Sidebar - Right Side */}
      {showStatsModal && (
        <div className="fixed right-0 top-16 bottom-0 w-full md:max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                <ChartBarIcon className="w-8 h-8 text-blue-600" />
                ข้อมูลสรุปทั้งหมด
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 gap-4">
                {statCards.map((stat, index) => {
                  const Icon = stat.icon;
                  const colorClasses = {
                    blue: 'bg-blue-500',
                    green: 'bg-green-500',
                    yellow: 'bg-yellow-500',
                    orange: 'bg-orange-500',
                  };

                  return (
                    <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                      <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                          </div>
                          <div className={`${colorClasses[stat.color as keyof typeof colorClasses]} p-4 rounded-lg`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>

              {/* Assets Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">จำนวนสินทรัพย์</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">สินทรัพย์ทั้งหมด</p>
                    <p className="text-lg font-semibold text-gray-800">{stats.totalAssets} แห่ง</p>
                  </div>
                  <div className="pl-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">บ้าน</p>
                      <p className="text-sm font-medium text-gray-700">{stats.assetsByType.house} หลัง</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">คอนโด</p>
                      <p className="text-sm font-medium text-gray-700">{stats.assetsByType.condo} หน่วย</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">อพาร์ทเมนต์</p>
                      <p className="text-sm font-medium text-gray-700">{stats.assetsByType.apartment} หน่วย</p>
                    </div>
                    {stats.assetsByType.land > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">ที่ดิน</p>
                        <p className="text-sm font-medium text-gray-700">{stats.assetsByType.land} แปลง</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">สถานะทรัพย์สิน</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">ปล่อยเช่าแล้ว</p>
                    <p className="text-lg font-semibold text-blue-600">{stats.assetsByStatus.rented} หลัง</p>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">รอการปล่อยเช่า</p>
                    <p className="text-lg font-semibold text-green-600">{stats.assetsByStatus.available} หลัง</p>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <p className="text-sm text-gray-600">ซ่อมแซม</p>
                    <p className="text-lg font-semibold text-orange-600">{stats.assetsByStatus.maintenance} หลัง</p>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">สถานะการชำระเงิน</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">ชำระแล้ว</p>
                    <p className="text-lg font-semibold text-green-600">{stats.paidCount} หลัง</p>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <p className="text-sm text-gray-600">ค้างชำระ</p>
                    <p className="text-lg font-semibold text-red-600">{stats.overdueCount} หลัง</p>
                  </div>
                </div>
              </div>

              {/* Income Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">รายได้</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">รายได้ต่อเดือน</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(stats.monthlyIncome)}</p>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-600">รายได้ที่เก็บได้ต่อเดือน</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.collectedThisMonth)}</p>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <p className="text-sm text-gray-600">รายได้ที่ค้างชำระ</p>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(stats.overdueAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowStatsModal(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  ปิด
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Sidebar - Right Side */}
      {showFilterModal && (
        <div className="fixed right-0 top-16 bottom-0 w-full md:max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                <FunnelIcon className="w-8 h-8 text-emerald-600" />
                ค้นหา/กรองสินทรัพย์
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Search Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MagnifyingGlassIcon className="w-5 h-5 inline mr-2" />
                  ค้นหาด้วยชื่อหรือที่อยู่
                </label>
                <input
                  type="text"
                  value={assetFilters.searchText || ''}
                  onChange={(e) => setAssetFilters({ ...assetFilters, searchText: e.target.value })}
                  placeholder="ค้นหาชื่อทรัพย์สิน, ที่อยู่, เขต, จังหวัด..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  สถานะทรัพย์สิน
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.status?.includes('available') || false}
                      onChange={(e) => {
                        const currentStatus = assetFilters.status || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, status: [...currentStatus, 'available'] });
                        } else {
                          const newStatus = currentStatus.filter(s => s !== 'available');
                          setAssetFilters({ ...assetFilters, status: newStatus.length > 0 ? newStatus : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                      <span className="text-sm text-gray-700">ว่าง</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.status?.includes('rented') || false}
                      onChange={(e) => {
                        const currentStatus = assetFilters.status || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, status: [...currentStatus, 'rented'] });
                        } else {
                          const newStatus = currentStatus.filter(s => s !== 'rented');
                          setAssetFilters({ ...assetFilters, status: newStatus.length > 0 ? newStatus : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                      <span className="text-sm text-gray-700">ให้เช่าแล้ว</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.status?.includes('maintenance') || false}
                      onChange={(e) => {
                        const currentStatus = assetFilters.status || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, status: [...currentStatus, 'maintenance'] });
                        } else {
                          const newStatus = currentStatus.filter(s => s !== 'maintenance');
                          setAssetFilters({ ...assetFilters, status: newStatus.length > 0 ? newStatus : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white"></div>
                      <span className="text-sm text-gray-700">ซ่อมแซม</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  ประเภททรัพย์สิน
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.type?.includes('house') || false}
                      onChange={(e) => {
                        const currentType = assetFilters.type || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, type: [...currentType, 'house'] });
                        } else {
                          const newType = currentType.filter(t => t !== 'house');
                          setAssetFilters({ ...assetFilters, type: newType.length > 0 ? newType : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span className="text-sm text-gray-700">บ้าน</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.type?.includes('condo') || false}
                      onChange={(e) => {
                        const currentType = assetFilters.type || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, type: [...currentType, 'condo'] });
                        } else {
                          const newType = currentType.filter(t => t !== 'condo');
                          setAssetFilters({ ...assetFilters, type: newType.length > 0 ? newType : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span className="text-sm text-gray-700">คอนโด</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.type?.includes('apartment') || false}
                      onChange={(e) => {
                        const currentType = assetFilters.type || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, type: [...currentType, 'apartment'] });
                        } else {
                          const newType = currentType.filter(t => t !== 'apartment');
                          setAssetFilters({ ...assetFilters, type: newType.length > 0 ? newType : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span className="text-sm text-gray-700">อพาร์ทเมนต์</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.type?.includes('land') || false}
                      onChange={(e) => {
                        const currentType = assetFilters.type || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, type: [...currentType, 'land'] });
                        } else {
                          const newType = currentType.filter(t => t !== 'land');
                          setAssetFilters({ ...assetFilters, type: newType.length > 0 ? newType : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <span className="text-sm text-gray-700">ที่ดิน</span>
                  </label>
                </div>
              </div>

              {/* Payment Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  สถานะการจ่ายเงิน
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.paymentStatus?.includes('paid') || false}
                      onChange={(e) => {
                        const currentPaymentStatus = assetFilters.paymentStatus || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, paymentStatus: [...currentPaymentStatus, 'paid'] });
                        } else {
                          const newPaymentStatus = currentPaymentStatus.filter(p => p !== 'paid');
                          setAssetFilters({ ...assetFilters, paymentStatus: newPaymentStatus.length > 0 ? newPaymentStatus : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                      <span className="text-sm text-gray-700">จ่ายครบ</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.paymentStatus?.includes('overdue') || false}
                      onChange={(e) => {
                        const currentPaymentStatus = assetFilters.paymentStatus || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, paymentStatus: [...currentPaymentStatus, 'overdue'] });
                        } else {
                          const newPaymentStatus = currentPaymentStatus.filter(p => p !== 'overdue');
                          setAssetFilters({ ...assetFilters, paymentStatus: newPaymentStatus.length > 0 ? newPaymentStatus : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                      <span className="text-sm text-gray-700">มีค้างชำระ</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.paymentStatus?.includes('pending') || false}
                      onChange={(e) => {
                        const currentPaymentStatus = assetFilters.paymentStatus || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, paymentStatus: [...currentPaymentStatus, 'pending'] });
                        } else {
                          const newPaymentStatus = currentPaymentStatus.filter(p => p !== 'pending');
                          setAssetFilters({ ...assetFilters, paymentStatus: newPaymentStatus.length > 0 ? newPaymentStatus : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
                      <span className="text-sm text-gray-700">รอการชำระ</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assetFilters.paymentStatus?.includes('no_contract') || false}
                      onChange={(e) => {
                        const currentPaymentStatus = assetFilters.paymentStatus || [];
                        if (e.target.checked) {
                          setAssetFilters({ ...assetFilters, paymentStatus: [...currentPaymentStatus, 'no_contract'] });
                        } else {
                          const newPaymentStatus = currentPaymentStatus.filter(p => p !== 'no_contract');
                          setAssetFilters({ ...assetFilters, paymentStatus: newPaymentStatus.length > 0 ? newPaymentStatus : undefined });
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white"></div>
                      <span className="text-sm text-gray-700">ไม่มีสัญญา</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Results Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">ผลการค้นหา</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {assetsWithLocation.length} แห่ง
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    จากทั้งหมด {allAssets.filter((a: Asset) => user?.role === 'owner' ? a.ownerId === user.id : true).length} แห่ง
                  </p>
                </div>
              </div>

              {/* Clear Filters Button */}
              {((assetFilters.status && assetFilters.status.length > 0) || (assetFilters.type && assetFilters.type.length > 0) || (assetFilters.paymentStatus && assetFilters.paymentStatus.length > 0) || assetFilters.searchText) && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setAssetFilters({})}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    ล้างตัวกรองทั้งหมด
                  </Button>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowFilterModal(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  ปิด
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Summary Sidebar - Right Side */}
      {showDocumentModal && (
        <div className="fixed right-0 top-16 bottom-0 w-full md:max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                <DocumentTextIcon className="w-8 h-8 text-indigo-600" />
                ออกเอกสาร
              </h3>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setDocumentType('');
                  setSelectedYear('');
                  setSelectedMonth('');
                  setSelectedTenant('');
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  เลือกประเภทเอกสาร
                </label>
                <select
                  value={documentType}
                  onChange={(e) => {
                    setDocumentType(e.target.value);
                    setSelectedYear('');
                    setSelectedMonth('');
                    setSelectedTenant('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="">-- เลือกประเภทเอกสาร --</option>
                  <option value="monthly_summary">สรุปรายได้ประจำเดือน</option>
                  <option value="annual_summary">สรุปรายได้ประจำปี</option>
                  <option value="invoice">ใบแจ้งหนี้</option>
                  <option value="receipt">ใบเสร็จ</option>
                  <option value="payment_report">รายงานการชำระเงิน</option>
                  <option value="contract_summary">สรุปสัญญาเช่า</option>
                </select>
              </div>

              {/* Year Selection - Show for monthly documents */}
              {documentType && (documentType === 'monthly_summary' || documentType === 'invoice' || documentType === 'receipt' || documentType === 'payment_report') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เลือกปี
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedMonth('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- เลือกปี --</option>
                    {Array.from({ length: 3 }, (_, i) => {
                      const currentYear = new Date().getFullYear();
                      const year = currentYear - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year + 543} (พ.ศ.)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Month Selection - Show after year is selected */}
              {documentType && selectedYear && (documentType === 'monthly_summary' || documentType === 'invoice' || documentType === 'receipt' || documentType === 'payment_report') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เลือกเดือน
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- เลือกเดือน --</option>
                    {(() => {
                      const currentDate = new Date();
                      const currentYear = currentDate.getFullYear();
                      const currentMonth = currentDate.getMonth(); // 0-11
                      const selectedYearInt = parseInt(selectedYear);
                      
                      // If selected year is current year, only show months up to current month
                      // If selected year is past year, show all 12 months
                      const maxMonth = selectedYearInt === currentYear ? currentMonth + 1 : 12;
                      
                      return Array.from({ length: maxMonth }, (_, i) => {
                        const date = new Date(selectedYearInt, i, 1);
                        const monthName = date.toLocaleDateString('th-TH', { month: 'long' });
                        const value = `${selectedYearInt}-${String(i + 1).padStart(2, '0')}`;
                        return (
                          <option key={value} value={value}>
                            {monthName}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
              )}

              {/* Tenant Selection - Show for tenant-specific documents */}
              {documentType && (documentType === 'invoice' || documentType === 'receipt' || documentType === 'payment_report' || documentType === 'contract_summary') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เลือกผู้เช่า
                  </label>
                  <select
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- เลือกผู้เช่า --</option>
                    {allContracts
                      .filter(contract => {
                        const tenant = allUsers.find((u: any) => u.id === contract.tenantId);
                        return tenant && tenant.role === 'tenant';
                      })
                      .map((contract) => {
                        const tenant = allUsers.find((u: any) => u.id === contract.tenantId);
                        if (!tenant) return null;
                        return (
                          <option key={contract.id} value={contract.tenantId}>
                            {tenant.name} ({contract.assetName || 'ไม่มีชื่อทรัพย์สิน'})
                          </option>
                        );
                      })}
                  </select>
                </div>
              )}

              {/* Export Format Selection */}
              {documentType && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เลือกรูปแบบไฟล์
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => setExportFormat('excel')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm w-full ${
                        exportFormat === 'excel'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Excel (.xls)
                    </button>
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors text-sm w-full ${
                        exportFormat === 'pdf'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              )}

              {/* Export Document Button */}
              {documentType && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      try {
                        exportDocument({
                          type: documentType as any,
                          format: exportFormat,
                          year: selectedYear,
                          month: selectedMonth,
                          tenantId: selectedTenant,
                          payments: allPayments,
                          contracts: allContracts,
                          assets: allAssets,
                          tenants: allUsers.filter((u: any) => u.role === 'tenant'),
                          stats: stats
                        });
                        
                        Swal.fire({
                          icon: 'success',
                          title: 'ออกรายงานสำเร็จ',
                          text: 'ไฟล์รายงานถูกดาวน์โหลดแล้ว',
                          timer: 2000,
                          showConfirmButton: false,
                        });
                      } catch (error) {
                        console.error('Export error:', error);
                        Swal.fire({
                          icon: 'error',
                          title: 'เกิดข้อผิดพลาด',
                          text: 'ไม่สามารถออกรายงานได้ กรุณาลองใหม่อีกครั้ง',
                        });
                      }
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    isDisabled={
                      (documentType === 'monthly_summary' || documentType === 'invoice' || documentType === 'receipt' || documentType === 'payment_report') && (!selectedYear || !selectedMonth) ||
                      (documentType === 'invoice' || documentType === 'receipt' || documentType === 'payment_report' || documentType === 'contract_summary') && !selectedTenant
                    }
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    ออกรายงาน
                  </Button>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowDocumentModal(false);
                    setDocumentType('');
                    setSelectedYear('');
                    setSelectedMonth('');
                    setSelectedTenant('');
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  ปิด
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Sidebar - Right Side */}
      {showSettingsModal && (
        <div className="fixed right-0 top-16 bottom-0 w-full md:max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
                <Cog6ToothIcon className="w-8 h-8 text-gray-600" />
                การตั้งค่า
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 md:mb-6 border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setSettingsTab('tenant')}
                className={`px-3 md:px-4 py-2 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  settingsTab === 'tenant'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ตั้งค่าผู้เช่า
              </button>
              <button
                onClick={() => setSettingsTab('general')}
                className={`px-3 md:px-4 py-2 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  settingsTab === 'general'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ตั้งค่าทั่วไป
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {settingsTab === 'tenant' ? (
                /* Tenant Settings Tab */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">จัดการผู้เช่า</h4>
                    <Button
                      color="primary"
                      size="sm"
                      onClick={async () => {
                        const token = getStoredToken();
                        if (!token) return;
                        apiClient.setToken(token);
                        
                        const newTenant = await showTenantForm();
                        if (newTenant) {
                          // Reload users
                          try {
                            const allUsersData = await apiClient.getUsers();
                            setAllUsers(allUsersData);
                          } catch (error) {
                            console.error('Error reloading users:', error);
                          }
                        }
                      }}
                    >
                      + เพิ่มผู้เช่า
                    </Button>
                  </div>
                  
                  <div className="space-y-2 md:space-y-3 w-full">
                    {loadingData ? (
                      <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
                    ) : allUsers.filter((u: any) => u.role === 'tenant').length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        ยังไม่มีผู้เช่า กดปุ่ม "+ เพิ่มผู้เช่า" เพื่อเพิ่มผู้เช่าใหม่
                      </div>
                    ) : (
                      allUsers
                        .filter((u: any) => u.role === 'tenant')
                        .map((tenant) => {
                          if (!tenant) return null;
                        
                        return (
                          <div 
                            key={tenant.id}
                            className="w-full"
                            onClick={() => {
                              showTenantDetail(tenant);
                            }}
                          >
                            <Card 
                              className="shadow-sm cursor-pointer hover:shadow-md transition-shadow w-full"
                            >
                              <CardBody className="p-4 w-full">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{tenant.name}</p>
                                    <p className="text-sm text-gray-600">เบอร์โทร: {tenant.phone}</p>
                                    <p className="text-xs text-gray-500">Username: {tenant.phone}</p>
                                  </div>
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        defaultChecked={true}
                                        className="sr-only peer"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2 flex-col sm:flex-row" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="bordered"
                                  className="w-full sm:w-auto"
                                  onClick={async () => {
                                    const token = getStoredToken();
                                    if (!token) return;
                                    apiClient.setToken(token);
                                    
                                    const updatedTenant = await showTenantForm(tenant);
                                    if (updatedTenant) {
                                      // Reload users
                                      try {
                                        const allUsersData = await apiClient.getUsers();
                                        setAllUsers(allUsersData);
                                      } catch (error) {
                                        console.error('Error reloading users:', error);
                                      }
                                    }
                                  }}
                                >
                                  แก้ไข
                                </Button>
                                <Button
                                  size="sm"
                                  color="danger"
                                  variant="solid"
                                  className="!bg-red-600 hover:!bg-red-700 !text-white w-full sm:w-auto"
                                  onClick={async () => {
                                    const result = await Swal.fire({
                                      title: 'ยืนยันการลบ',
                                      text: `คุณต้องการลบผู้เช่า "${tenant.name}" หรือไม่?`,
                                      icon: 'warning',
                                      showCancelButton: true,
                                      confirmButtonText: 'ลบ',
                                      cancelButtonText: 'ยกเลิก',
                                      confirmButtonColor: '#dc2626',
                                      cancelButtonColor: '#6b7280',
                                    });

                                  if (result.isConfirmed) {
                                    try {
                                      const token = getStoredToken();
                                      if (!token) return;
                                      apiClient.setToken(token);
                                      
                                      await apiClient.deleteUser(tenant.id);
                                      
                                      await Swal.fire({
                                        icon: 'success',
                                        title: 'ลบสำเร็จ',
                                        text: 'ผู้เช่าถูกลบแล้ว',
                                        timer: 1500,
                                        showConfirmButton: false,
                                      });
                                      
                                      // Reload users
                                      const allUsersData = await apiClient.getUsers();
                                      setAllUsers(allUsersData);
                                    } catch (error) {
                                      console.error('Error deleting tenant:', error);
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'เกิดข้อผิดพลาด',
                                        text: 'ไม่สามารถลบผู้เช่าได้',
                                      });
                                    }
                                  }
                                  }}
                                >
                                  ลบ
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* General Settings Tab */
                <div>
                  <h4 className="text-base md:text-lg font-semibold text-gray-800 mb-4">ตั้งค่าทั่วไป</h4>
                  
                  <div className="space-y-4">
                    {/* QR Code Upload */}
                    <Card className="shadow-sm">
                      <CardBody className="p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          QR Code สำหรับรับเงิน
                        </label>
                        {qrCodeImage ? (
                          <div className="text-center">
                            <img 
                              src={qrCodeImage} 
                              alt="QR Code" 
                              className="mx-auto w-48 h-48 border-2 border-gray-300 rounded-lg mb-3"
                            />
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const imageUrl = event.target?.result as string;
                                    // Store QR code in localStorage
                                    localStorage.setItem('payment_qr_code', imageUrl);
                                    setQrCodeImage(imageUrl);
                                    
                                    Swal.fire({
                                      icon: 'success',
                                      title: 'อัปโหลด QR Code เรียบร้อย',
                                      text: 'QR Code สำหรับรับเงินได้รับการบันทึกแล้ว',
                                      timer: 2000,
                                      showConfirmButton: false,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                              <Button
                                size="sm"
                                color="primary"
                                variant="bordered"
                                as="span"
                                className="mr-2"
                              >
                                เปลี่ยน QR Code
                              </Button>
                            </label>
                            <Button
                              size="sm"
                              color="danger"
                              variant="bordered"
                              onClick={() => {
                                localStorage.removeItem('payment_qr_code');
                                setQrCodeImage(null);
                                Swal.fire({
                                  icon: 'success',
                                  title: 'ลบ QR Code เรียบร้อย',
                                  timer: 1500,
                                  showConfirmButton: false,
                                });
                              }}
                            >
                              ลบ
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <PhotoIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 mb-2">คลิกเพื่ออัปโหลด QR Code</p>
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const imageUrl = event.target?.result as string;
                                    // Store QR code in localStorage
                                    localStorage.setItem('payment_qr_code', imageUrl);
                                    setQrCodeImage(imageUrl);
                                    
                                    Swal.fire({
                                      icon: 'success',
                                      title: 'อัปโหลด QR Code เรียบร้อย',
                                      text: 'QR Code สำหรับรับเงินได้รับการบันทึกแล้ว',
                                      timer: 2000,
                                      showConfirmButton: false,
                                    });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                              <Button
                                size="sm"
                                color="primary"
                                variant="bordered"
                                as="span"
                              >
                                เลือกไฟล์
                              </Button>
                            </label>
                          </div>
                        )}
                      </CardBody>
                    </Card>

                    {/* Other Settings */}
                    <Card className="shadow-sm">
                      <CardBody className="p-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          ตั้งค่าอื่นๆ
                        </label>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">แจ้งเตือนอัตโนมัติ</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                defaultChecked={true}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </label>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  ปิด
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Detail Panel - Left Side */}
      {selectedAsset && (
        <div className="fixed left-0 top-16 bottom-0 w-full md:max-w-lg bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800">ข้อมูลสรุปทรัพย์สิน</h3>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Asset ID and Status */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <p className="text-xs text-gray-500 mb-1">รหัสทรัพย์สิน</p>
              <p className="text-sm font-mono text-gray-800">{selectedAsset.id}</p>
              <div className="mt-3">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedAsset.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : selectedAsset.status === 'rented'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {getStatusText(selectedAsset.status)}
                </span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-4">
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  รายละเอียดสินทรัพย์
                </button>
                <button
                  onClick={() => setActiveTab('lease')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'lease'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  การเช่า
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'payment'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  การจ่ายเงิน
                </button>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'maintenance'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  การแจ้งซ่อม
                </button>
                {selectedAsset.isParent && (
                  <button
                    onClick={() => setActiveTab('units')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'units'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    ห้องเช่า
                  </button>
                )}
                {/* Documents tab - Only show for owner/admin */}
                {(user?.role === 'owner' || user?.role === 'admin') && (
                <button
                  onClick={() => setActiveTab('documents')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'documents'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  เอกสาร
                </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-4 md:space-y-6">
                  {/* Tab 1: รายละเอียดสินทรัพย์ */}
                  {activeTab === 'details' && (
                    <>
                      {selectedAsset.isParent && (
                        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-blue-800">ที่ดินหลัก</p>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {selectedAsset.totalUnits || 0} ห้อง
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-700">
                            <div>
                              <span className="text-blue-600">อัตราการเช่า:</span> {getOccupancyRate(selectedAsset.id).toFixed(1)}%
                            </div>
                            <div>
                              <span className="text-blue-600">รายได้รวม:</span> {formatCurrency(getTotalIncomeFromParent(selectedAsset.id))}/เดือน
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">ข้อมูลพื้นฐาน</h4>
                        {(user?.role === 'owner' || user?.role === 'admin') && (
                          <Button
                            size="sm"
                            color="primary"
                            variant="bordered"
                            startContent={<PencilIcon className="w-4 h-4" />}
                            onPress={handleEditAsset}
                          >
                            แก้ไข
                          </Button>
                        )}
                      </div>
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ชื่อทรัพย์สิน</label>
                        <p className="text-sm font-medium text-gray-800">{selectedAsset.name}</p>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ที่อยู่</label>
                        <p className="text-sm text-gray-800 flex items-start gap-2">
                          <span>📍</span>
                          <span>{selectedAsset.address}, {selectedAsset.district}, {selectedAsset.province}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                          <p className="text-sm font-medium text-gray-800">{selectedAsset.latitude?.toFixed(8)}</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                          <p className="text-sm font-medium text-gray-800">{selectedAsset.longitude?.toFixed(8)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">ขนาด</label>
                          <p className="text-sm font-medium text-gray-800">{selectedAsset.size} ตร.ม.</p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">จำนวนห้อง</label>
                          <p className="text-sm font-medium text-gray-800">{selectedAsset.rooms} ห้อง</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ประเภท</label>
                        <p className="text-sm font-medium text-gray-800 capitalize">{selectedAsset.type}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลการเงิน</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600">ราคาซื้อ</label>
                        <p className="text-sm font-medium text-gray-800">{formatCurrency(selectedAsset.purchasePrice)}</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <label className="text-sm text-gray-600">มูลค่าปัจจุบัน</label>
                        <p className="text-sm font-semibold text-blue-600">{formatCurrency(selectedAsset.currentValue)}</p>
                      </div>
                    </div>
                  </div>

                  {selectedAsset.description && (
                    <div className="border-t border-gray-200 pt-4">
                      <label className="block text-xs text-gray-500 mb-2">รายละเอียด</label>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedAsset.description}</p>
                    </div>
                  )}
                </>
              )}

              {/* Tab 2: การเช่า */}
              {activeTab === 'lease' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {selectedAsset.isParent ? 'สัญญาเช่าทั้งหมด' : 'สัญญาเช่า'}
                    </h4>
                    {(user?.role === 'owner' || user?.role === 'admin') && !selectedAsset.isParent && (
                      <Button
                        size="sm"
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={handleCreateContract}
                      >
                        เพิ่มสัญญา
                      </Button>
                    )}
                  </div>
                  {assetContracts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>ยังไม่มีสัญญาเช่า</p>
                      {(user?.role === 'owner' || user?.role === 'admin') && !selectedAsset.isParent && (
                        <Button
                          size="sm"
                          color="primary"
                          className="mt-4"
                          startContent={<PlusIcon className="w-4 h-4" />}
                          onPress={handleCreateContract}
                        >
                          สร้างสัญญาแรก
                        </Button>
                      )}
                    </div>
                  ) : selectedAsset.isParent ? (
                    // Group contracts by child asset (room)
                    <div className="space-y-4 md:space-y-6">
                      {childAssets.map((unit) => {
                        const unitContracts = allContracts.filter((c: Contract) => c.assetId === unit.id);
                        
                        return (
                          <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-base font-semibold text-gray-800">
                                {unit.unitNumber ? `ห้อง ${unit.unitNumber}` : unit.name}
                              </h5>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                unit.status === 'available'
                                  ? 'bg-green-100 text-green-700'
                                  : unit.status === 'rented'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {getStatusText(unit.status)}
                              </span>
                            </div>
                            
                            {unitContracts.length === 0 ? (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                <p>ยังไม่มีสัญญาเช่า</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {unitContracts.map((contract) => (
                                  <Card key={contract.id} className="shadow-sm">
                                    <CardBody className="p-4">
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm font-semibold text-gray-800">สัญญาเลขที่ {contract.contractNumber || contract.id}</p>
                                            <p className="text-xs text-gray-500 mt-1">ผู้เช่า: {contract.tenantName}</p>
                                          </div>
                                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            contract.status === 'active'
                                              ? 'bg-green-100 text-green-700'
                                              : contract.status === 'expired'
                                              ? 'bg-gray-100 text-gray-700'
                                              : 'bg-red-100 text-red-700'
                                          }`}>
                                            {contract.status === 'active' ? 'ใช้งาน' : contract.status === 'expired' ? 'หมดอายุ' : 'ยกเลิก'}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                          <div>
                                            <p className="text-xs text-gray-500">วันเริ่มต้น</p>
                                            <p className="font-medium text-gray-800">{new Date(contract.startDate).toLocaleDateString('th-TH')}</p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">วันสิ้นสุด</p>
                                            <p className="font-medium text-gray-800">{new Date(contract.endDate).toLocaleDateString('th-TH')}</p>
                                          </div>
                                        </div>
                                        <div className="border-t border-gray-100 pt-3">
                                          <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs text-gray-500">ค่าเช่า</p>
                                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(contract.rentAmount)}/เดือน</p>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-500">ค่าเช่าล่วงหน้า</p>
                                            <p className="text-sm font-medium text-gray-800">{formatCurrency(contract.deposit)}</p>
                                          </div>
                                        </div>
                                        <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                                          <Button
                                            size="sm"
                                            variant="bordered"
                                            color="success"
                                            startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                            onPress={async () => {
                                              const asset = allAssets.find((a: Asset) => a.id === contract.assetId);
                                              await generateContractDocument(contract, asset);
                                            }}
                                            className="w-full"
                                          >
                                            ส่งออกเอกสารสัญญา
                                          </Button>
                                          {(user?.role === 'owner' || user?.role === 'admin') && (
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                variant="bordered"
                                                startContent={<PencilIcon className="w-4 h-4" />}
                                                onPress={() => handleEditContract(contract)}
                                                className="flex-1"
                                              >
                                                แก้ไข
                                              </Button>
                                              {contract.status === 'active' && (
                                                <Button
                                                  size="sm"
                                                  color="danger"
                                                  variant="bordered"
                                                  startContent={<XMarkIcon className="w-4 h-4" />}
                                                  onPress={() => handleTerminateContract(contract)}
                                                  className="flex-1"
                                                >
                                                  ปิดการใช้งาน
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </CardBody>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assetContracts.map((contract) => (
                        <Card key={contract.id} className="shadow-sm">
                          <CardBody className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">สัญญาเลขที่ {contract.contractNumber || contract.id}</p>
                                  <p className="text-xs text-gray-500 mt-1">ผู้เช่า: {contract.tenantName}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  contract.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : contract.status === 'expired'
                                    ? 'bg-gray-100 text-gray-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {contract.status === 'active' ? 'ใช้งาน' : contract.status === 'expired' ? 'หมดอายุ' : 'ยกเลิก'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">วันเริ่มต้น</p>
                                  <p className="font-medium text-gray-800">{new Date(contract.startDate).toLocaleDateString('th-TH')}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">วันสิ้นสุด</p>
                                  <p className="font-medium text-gray-800">{new Date(contract.endDate).toLocaleDateString('th-TH')}</p>
                                </div>
                              </div>
                              <div className="border-t border-gray-100 pt-3">
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-xs text-gray-500">ค่าเช่า</p>
                                  <p className="text-sm font-semibold text-blue-600">{formatCurrency(contract.rentAmount)}/เดือน</p>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className="text-xs text-gray-500">ค่าเช่าล่วงหน้า</p>
                                  <p className="text-sm font-medium text-gray-800">{formatCurrency(contract.deposit)}</p>
                                </div>
                              </div>
                              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  variant="bordered"
                                  color="success"
                                  startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                  onPress={async () => {
                                    const asset = allAssets.find((a: Asset) => a.id === contract.assetId);
                                    await generateContractDocument(contract, asset);
                                  }}
                                  className="w-full"
                                >
                                  ส่งออกเอกสารสัญญา
                                </Button>
                                {(user?.role === 'owner' || user?.role === 'admin') && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="bordered"
                                      startContent={<PencilIcon className="w-4 h-4" />}
                                      onPress={() => handleEditContract(contract)}
                                      className="flex-1"
                                    >
                                      แก้ไข
                                    </Button>
                                    {contract.status === 'active' && (
                                      <Button
                                        size="sm"
                                        color="danger"
                                        variant="bordered"
                                        startContent={<XMarkIcon className="w-4 h-4" />}
                                        onPress={() => handleTerminateContract(contract)}
                                        className="flex-1"
                                      >
                                        ปิดการใช้งาน
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: การจ่ายเงิน */}
              {activeTab === 'payment' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">ประวัติการชำระเงิน</h4>
                    {(user?.role === 'owner' || user?.role === 'admin') && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                        onPress={() => {
                          const allPayments = assetContracts.flatMap(c => 
                              allPayments.filter((p: Payment) => p.contractId === c.id)
                          );
                          exportPaymentsToExcel(allPayments, assetContracts, [selectedAsset!], paymentFilters);
                        }}
                      >
                        Excel
                      </Button>
                      <Button
                        size="sm"
                        variant="bordered"
                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                        onPress={() => {
                          const allPayments = assetContracts.flatMap(c => 
                              allPayments.filter((p: Payment) => p.contractId === c.id)
                          );
                          exportPaymentsToPDF(allPayments, assetContracts, [selectedAsset!], paymentFilters);
                        }}
                      >
                        PDF
                      </Button>
                    </div>
                    )}
                  </div>
                  
                  {/* Tenant Payment Section - Show payment list for due/upcoming payments */}
                  {user?.role === 'tenant' && assetContracts.length > 0 && (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // Filter payments: show only those that are due or within 10 days
                    const dueOrUpcomingPayments = assetPayments.filter(p => {
                      if (p.status !== 'pending') return false;
                      
                      const dueDate = new Date(p.dueDate);
                      dueDate.setHours(0, 0, 0, 0);
                      
                      // Calculate days until due date
                      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Show if due date has passed or within 10 days
                      return daysUntilDue <= 10;
                    });
                    
                    return dueOrUpcomingPayments.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">รายการที่ต้องชำระ:</p>
                        {dueOrUpcomingPayments.map(payment => {
                          const contract = assetContracts.find(c => c.id === payment.contractId);
                          const dueDate = new Date(payment.dueDate);
                          dueDate.setHours(0, 0, 0, 0);
                          const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          const isDue = daysUntilDue <= 0;
                          
                          return (
                            <div key={payment.id} className="bg-white p-3 rounded-lg mb-2 border border-gray-200 shadow-sm">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-800">
                                    {payment.type === 'rent' ? 'ค่าเช่า' : payment.type === 'deposit' ? 'ค่าเช่าล่วงหน้า' : payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ'}
                                  </p>
                                  {contract && (
                                    <p className="text-xs text-gray-500 mt-1">สัญญาเลขที่ {contract.contractNumber || contract.id}</p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    กำหนดชำระ: {new Date(payment.dueDate).toLocaleDateString('th-TH')}
                                    {!isDue && daysUntilDue > 0 && (
                                      <span className="text-blue-600 ml-2">(อีก {daysUntilDue} วัน)</span>
                                    )}
                                    {isDue && (
                                      <span className="text-red-600 ml-2">(ถึงกำหนดแล้ว)</span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-sm font-semibold text-blue-600 mb-2">{formatCurrency(payment.amount)}</p>
                                  {isDue && (
                                    <Button
                                      size="sm"
                                      color="primary"
                                      variant="solid"
                                      onPress={() => {
                                        setSelectedPayment(payment);
                                        setTempProofImages([]); // Reset temp images when selecting payment
                                      }}
                                    >
                                      จ่ายเงิน
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Filters */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">กรองข้อมูล</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">สถานะ</label>
                        <select
                          value={paymentFilters.status || ''}
                          onChange={(e) => setPaymentFilters({ ...paymentFilters, status: e.target.value || undefined })}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="">ทั้งหมด</option>
                          <option value="paid">ชำระแล้ว</option>
                          <option value="pending">รอชำระ</option>
                          <option value="waiting_approval">รออนุมัติ</option>
                          <option value="overdue">ค้างชำระ</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">ประเภท</label>
                        <select
                          value={paymentFilters.type || ''}
                          onChange={(e) => setPaymentFilters({ ...paymentFilters, type: e.target.value || undefined })}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="">ทั้งหมด</option>
                          <option value="rent">ค่าเช่า</option>
                          <option value="deposit">ค่าเช่าล่วงหน้า</option>
                          <option value="utility">ค่าน้ำ-ไฟ</option>
                          <option value="other">อื่นๆ</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">จากวันที่</label>
                        <input
                          type="date"
                          value={paymentFilters.dateFrom || ''}
                          onChange={(e) => setPaymentFilters({ ...paymentFilters, dateFrom: e.target.value || undefined })}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">ถึงวันที่</label>
                        <input
                          type="date"
                          value={paymentFilters.dateTo || ''}
                          onChange={(e) => setPaymentFilters({ ...paymentFilters, dateTo: e.target.value || undefined })}
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                    </div>
                    {(paymentFilters.status || paymentFilters.type || paymentFilters.dateFrom || paymentFilters.dateTo) && (
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        className="mt-2"
                        onPress={() => setPaymentFilters({})}
                      >
                        ล้างตัวกรอง
                      </Button>
                    )}
                  </div>

                  {assetPayments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>ไม่พบรายการชำระเงิน{Object.keys(paymentFilters).length > 0 ? ' ตามเงื่อนไขที่กรอง' : ''}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assetPayments.map((payment) => {
                        const contract = assetContracts.find(c => c.id === payment.contractId);
                        return (
                          <Card key={payment.id} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardBody className="p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800">
                                      {payment.type === 'rent' ? 'ค่าเช่า' : payment.type === 'deposit' ? 'ค่าเช่าล่วงหน้า' : payment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ'}
                                    </p>
                                    {contract && (
                                      <p className="text-xs text-gray-500 mt-1">สัญญาเลขที่ {contract.contractNumber || contract.id}</p>
                                    )}
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    payment.status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : payment.status === 'overdue'
                                      ? 'bg-red-100 text-red-700'
                                      : payment.status === 'waiting_approval'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {payment.status === 'paid' ? 'ชำระแล้ว' : payment.status === 'overdue' ? 'ค้างชำระ' : payment.status === 'waiting_approval' ? 'รออนุมัติ' : 'รอชำระ'}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                  <div>
                                    <p className="text-xs text-gray-500">กำหนดชำระ</p>
                                    <p className="text-sm font-medium text-gray-800">{new Date(payment.dueDate).toLocaleDateString('th-TH')}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-gray-500">จำนวนเงิน</p>
                                    <p className="text-sm font-semibold text-blue-600">{formatCurrency(payment.amount)}</p>
                                  </div>
                                </div>
                                {payment.paidDate && (
                                  <div className="pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-500">วันที่ชำระ: {new Date(payment.paidDate).toLocaleDateString('th-TH')}</p>
                                  </div>
                                )}
                                {payment.proofImages && payment.proofImages.length > 0 && (
                                  <div className="pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-500 mb-2">หลักฐานการชำระเงิน: {payment.proofImages.length} ไฟล์</p>
                                    <div className="flex gap-2">
                                      {payment.proofImages.slice(0, 3).map((img, idx) => (
                                        <img
                                          key={idx}
                                          src={img}
                                          alt={`หลักฐาน ${idx + 1}`}
                                          className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80"
                                          onClick={() => window.open(img, '_blank')}
                                        />
                                      ))}
                                      {payment.proofImages.length > 3 && (
                                        <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                                          +{payment.proofImages.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="bordered"
                                      className="flex-1"
                                      onPress={() => {
                                        setSelectedPayment(payment);
                                        setTempProofImages([]); // Reset temp images when selecting payment
                                      }}
                                    >
                                      ดูรายละเอียด
                                    </Button>
                                    {payment.status === 'paid' && (
                                      <Button
                                        size="sm"
                                        variant="bordered"
                                        color="success"
                                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                        className="flex-1"
                                        onPress={async () => {
                                          const asset = allAssets.find((a: Asset) => a.id === contract?.assetId);
                                          if (contract && asset) {
                                            await generateReceiptDocument(payment, contract, asset);
                                          }
                                        }}
                                      >
                                        พิมพ์ใบเสร็จ
                                      </Button>
                                    )}
                                  </div>
                                  {(payment.status === 'pending' || payment.status === 'waiting_approval') && (user?.role === 'owner' || user?.role === 'admin') && (
                                    <Button
                                      size="sm"
                                      color="success"
                                      className="w-full"
                                      onPress={async () => {
                                        const today = new Date().toISOString().split('T')[0];
                                        
                                        const result = await Swal.fire({
                                          title: 'อนุมัติการชำระเงิน',
                                          html: `
                                            <div style="text-align: left;">
                                              <p style="margin-bottom: 15px;">จำนวนเงิน: <strong>${formatCurrency(payment.amount)}</strong></p>
                                              <div style="margin-bottom: 15px;">
                                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">วันที่ชำระเงิน:</label>
                                                <input type="date" id="paidDate" value="${today}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                              </div>
                                              <div style="margin-bottom: 15px;">
                                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">วันที่ออกใบเสร็จ:</label>
                                                <input type="date" id="receiptDate" value="${today}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                              </div>
                                              <div style="margin-bottom: 15px;">
                                                <label style="display: block; margin-bottom: 5px; font-weight: 600;">วิธีการชำระเงิน:</label>
                                                <select id="paymentMethod" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                                  <option value="โอนเงิน">โอนเงิน</option>
                                                  <option value="เงินสด">เงินสด</option>
                                                  <option value="เช็ค">เช็ค</option>
                                                  <option value="อื่นๆ">อื่นๆ</option>
                                                </select>
                                              </div>
                                            </div>
                                          `,
                                          showCancelButton: true,
                                          confirmButtonText: 'อนุมัติ',
                                          cancelButtonText: 'ยกเลิก',
                                          confirmButtonColor: '#10b981',
                                          cancelButtonColor: '#6b7280',
                                          preConfirm: () => {
                                            const paidDate = (document.getElementById('paidDate') as HTMLInputElement)?.value;
                                            const receiptDate = (document.getElementById('receiptDate') as HTMLInputElement)?.value;
                                            const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement)?.value;
                                            
                                            if (!paidDate || !receiptDate || !paymentMethod) {
                                              Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
                                              return false;
                                            }
                                            
                                            return { paidDate, receiptDate, paymentMethod };
                                          },
                                        });
                                        
                                        if (result.isConfirmed && result.value) {
                                          try {
                                            const token = getStoredToken();
                                            if (!token) return;
                                            apiClient.setToken(token);
                                            
                                            await apiClient.updatePayment(payment.id, {
                                              status: 'paid',
                                              paidDate: result.value.paidDate,
                                              receiptDate: result.value.receiptDate,
                                              paymentMethod: result.value.paymentMethod,
                                            });
                                          
                                          // Reload payment to get updated receiptNumber
                                          // Wait a bit for backend to process
                                          await new Promise(resolve => setTimeout(resolve, 500));
                                          const updatedPayment = await apiClient.getPayment(payment.id);
                                          setPaymentsRefreshKey(prev => prev + 1);
                                          
                                          // Generate receipt automatically
                                          if (updatedPayment && contract) {
                                              const asset = allAssets.find((a: Asset) => a.id === contract.assetId);
                                            if (asset) {
                                              // Show success message first
                                              await Swal.fire({
                                                icon: 'success',
                                                title: 'อนุมัติเรียบร้อย',
                                                text: 'การชำระเงินได้รับการอนุมัติแล้ว กำลังเปิดใบเสร็จรับเงิน...',
                                                timer: 1500,
                                                showConfirmButton: false,
                                              });
                                              
                                              // Generate and open receipt with updated payment data
                                              setTimeout(async () => {
                                                await generateReceiptDocument(updatedPayment, contract, asset);
                                              }, 300);
                                            }
                                          } else {
                                            await Swal.fire({
                                              icon: 'success',
                                              title: 'อนุมัติเรียบร้อย',
                                              text: 'การชำระเงินได้รับการอนุมัติแล้ว',
                                              timer: 2000,
                                              showConfirmButton: false,
                                              });
                                            }
                                          } catch (error: any) {
                                            await Swal.fire({
                                              icon: 'error',
                                              title: 'เกิดข้อผิดพลาด',
                                              text: error.message || 'ไม่สามารถอนุมัติการชำระเงินได้',
                                            });
                                          }
                                        }
                                      }}
                                    >
                                      อนุมัติ
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Detail Modal */}
              {selectedPayment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-4">
                    <div className="p-4 md:p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">รายละเอียดการชำระเงิน</h3>
                        <button
                          onClick={() => {
                            setSelectedPayment(null);
                            setTempProofImages([]); // Reset temp images when closing
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {(() => {
                        const contract = assetContracts.find(c => c.id === selectedPayment.contractId);
                        const asset = contract ? allAssets.find((a: Asset) => a.id === contract.assetId) : null;
                        
                        return (
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">ประเภท</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {selectedPayment.type === 'rent' ? 'ค่าเช่า' : 
                                 selectedPayment.type === 'deposit' ? 'ค่าเช่าล่วงหน้า' : 
                                 selectedPayment.type === 'utility' ? 'ค่าน้ำ-ไฟ' : 'อื่นๆ'}
                              </p>
                            </div>
                            
                            {contract && (
                              <>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">สัญญาเลขที่</p>
                                  <p className="text-sm font-medium text-gray-800">{contract.contractNumber || contract.id}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">ทรัพย์สิน</p>
                                  <p className="text-sm font-medium text-gray-800">{asset?.name || contract.assetName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">ผู้เช่า</p>
                                  <p className="text-sm font-medium text-gray-800">{contract.tenantName}</p>
                                </div>
                              </>
                            )}
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">จำนวนเงิน</p>
                              <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedPayment.amount)}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">กำหนดชำระ</p>
                              <p className="text-sm font-medium text-gray-800">
                                {new Date(selectedPayment.dueDate).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">สถานะ</p>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                selectedPayment.status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : selectedPayment.status === 'overdue'
                                  ? 'bg-red-100 text-red-700'
                                  : selectedPayment.status === 'waiting_approval'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {selectedPayment.status === 'paid' ? 'ชำระแล้ว' : 
                                 selectedPayment.status === 'overdue' ? 'ค้างชำระ' : 
                                 selectedPayment.status === 'waiting_approval' ? 'รออนุมัติ' : 'รอชำระ'}
                              </span>
                            </div>
                            
                            {selectedPayment.paidDate && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">วันที่ชำระ</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {new Date(selectedPayment.paidDate).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">วันที่สร้าง</p>
                              <p className="text-sm font-medium text-gray-800">
                                {new Date(selectedPayment.createdAt).toLocaleDateString('th-TH')}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">อัปเดตล่าสุด</p>
                              <p className="text-sm font-medium text-gray-800">
                                {new Date(selectedPayment.updatedAt).toLocaleDateString('th-TH')}
                              </p>
                            </div>

                            {/* หลักฐานการชำระเงิน */}
                            <div className="pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-700">หลักฐานการชำระเงิน</p>
                                {selectedPayment.status === 'pending' && (user?.role === 'tenant') && (
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={async (e) => {
                                        const files = e.target.files;
                                        if (!files || files.length === 0) return;

                                        // Convert files to base64
                                        const imagePromises = Array.from(files).map((file) => {
                                          return new Promise<string>((resolve) => {
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                              resolve(e.target?.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                          });
                                        });

                                        const imageUrls = await Promise.all(imagePromises);
                                        
                                        // Add to temporary proof images (not saved yet)
                                        setTempProofImages([...tempProofImages, ...imageUrls]);
                                        
                                        // Reset file input
                                        e.target.value = '';
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="bordered"
                                      color="primary"
                                      startContent={<PlusIcon className="w-4 h-4" />}
                                      as="span"
                                    >
                                      แนบหลักฐาน
                                    </Button>
                                  </label>
                                )}
                              </div>
                              
                              {(() => {
                                // Show existing images + temporary images
                                const existingImages = selectedPayment.proofImages || [];
                                const allImages = [...existingImages, ...tempProofImages];
                                
                                return allImages.length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      {allImages.map((imageUrl, index) => {
                                        const isTemp = index >= existingImages.length;
                                        return (
                                          <div key={index} className="relative group">
                                            <img
                                              src={imageUrl}
                                              alt={`หลักฐานการชำระเงิน ${index + 1}`}
                                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={() => {
                                                // Open image in new tab
                                                window.open(imageUrl, '_blank');
                                              }}
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                              <PhotoIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            {/* Delete button - show for tenant when payment is pending */}
                                            {selectedPayment.status === 'pending' && (user?.role === 'tenant') && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (isTemp) {
                                                    // Remove from temp images
                                                    const tempIndex = index - existingImages.length;
                                                    setTempProofImages(tempProofImages.filter((_, i) => i !== tempIndex));
                                                  } else {
                                                    // For existing images, we'll need to track which ones to remove
                                                    // For now, just remove from display by updating selectedPayment
                                                    // This is a simplified approach - in production you might want a separate state
                                                    const newExistingImages = existingImages.filter((_, i) => i !== index);
                                                    setSelectedPayment({
                                                      ...selectedPayment,
                                                      proofImages: newExistingImages,
                                                    });
                                                  }
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                                                title="ลบรูปภาพ"
                                              >
                                                <XMarkIcon className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    
                                    {/* Confirm button - only show if there are temporary images or changes */}
                                    {selectedPayment.status === 'pending' && (user?.role === 'tenant') && tempProofImages.length > 0 && (
                                      <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
                                        <Button
                                          size="sm"
                                          variant="light"
                                          color="danger"
                                          onPress={() => {
                                            // Cancel: reset temp images
                                            setTempProofImages([]);
                                          }}
                                        >
                                          ยกเลิก
                                        </Button>
                                        <Button
                                          size="sm"
                                          color="success"
                                          variant="solid"
                                          onPress={async () => {
                                            try {
                                              const token = getStoredToken();
                                              if (!token) return;
                                              apiClient.setToken(token);
                                              
                                              // Combine existing and temp images
                                              const currentImages = selectedPayment.proofImages || [];
                                              const finalImages = [...currentImages, ...tempProofImages];
                                              
                                              // Update payment with proof images and change status to waiting_approval
                                              const updatedPayment = await apiClient.updatePayment(selectedPayment.id, {
                                                proofImages: finalImages,
                                                status: 'waiting_approval',
                                              });

                                              if (updatedPayment) {
                                                // Update selected payment state
                                                setSelectedPayment(updatedPayment);
                                                setTempProofImages([]);
                                                setPaymentsRefreshKey(prev => prev + 1);
                                                
                                                await Swal.fire({
                                                  icon: 'success',
                                                  title: 'ยืนยันการชำระเงินเรียบร้อย',
                                                  text: 'หลักฐานการชำระเงินได้รับการบันทึกแล้ว และได้แจ้งเตือนเจ้าของทรัพย์สินแล้ว',
                                                  timer: 3000,
                                                  showConfirmButton: false,
                                                });
                                              }
                                            } catch (error: any) {
                                              await Swal.fire({
                                                icon: 'error',
                                                title: 'เกิดข้อผิดพลาด',
                                                text: error.message || 'ไม่สามารถยืนยันการชำระเงินได้',
                                              });
                                            }
                                          }}
                                        >
                                          ยืนยันการชำระเงิน
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                    <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">ยังไม่มีหลักฐานการชำระเงิน</p>
                                    {selectedPayment.status === 'pending' && (user?.role === 'tenant') && (
                                      <p className="text-xs text-gray-400 mt-1">คลิกปุ่ม "แนบหลักฐาน" เพื่ออัปโหลด</p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            
                            <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
                              {(selectedPayment.status === 'pending' || selectedPayment.status === 'waiting_approval') && (user?.role === 'owner' || user?.role === 'admin') && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    color="success"
                                    className="flex-1"
                                    onPress={async () => {
                                    const today = new Date().toISOString().split('T')[0];
                                    
                                    const result = await Swal.fire({
                                      title: 'อนุมัติการชำระเงิน',
                                      html: `
                                        <div style="text-align: left;">
                                          <p style="margin-bottom: 15px;">จำนวนเงิน: <strong>${formatCurrency(selectedPayment.amount)}</strong></p>
                                          <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">วันที่ชำระเงิน:</label>
                                            <input type="date" id="paidDate" value="${today}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                          </div>
                                          <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">วันที่ออกใบเสร็จ:</label>
                                            <input type="date" id="receiptDate" value="${today}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                          </div>
                                          <div style="margin-bottom: 15px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: 600;">วิธีการชำระเงิน:</label>
                                            <select id="paymentMethod" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                              <option value="โอนเงิน">โอนเงิน</option>
                                              <option value="เงินสด">เงินสด</option>
                                              <option value="เช็ค">เช็ค</option>
                                              <option value="อื่นๆ">อื่นๆ</option>
                                            </select>
                                          </div>
                                        </div>
                                      `,
                                      showCancelButton: true,
                                      confirmButtonText: 'อนุมัติ',
                                      cancelButtonText: 'ยกเลิก',
                                      confirmButtonColor: '#10b981',
                                      cancelButtonColor: '#6b7280',
                                      preConfirm: () => {
                                        const paidDate = (document.getElementById('paidDate') as HTMLInputElement)?.value;
                                        const receiptDate = (document.getElementById('receiptDate') as HTMLInputElement)?.value;
                                        const paymentMethod = (document.getElementById('paymentMethod') as HTMLSelectElement)?.value;
                                        
                                        if (!paidDate || !receiptDate || !paymentMethod) {
                                          Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
                                          return false;
                                        }
                                        
                                        return { paidDate, receiptDate, paymentMethod };
                                      },
                                    });
                                    
                                    if (result.isConfirmed && result.value) {
                                      try {
                                        const token = getStoredToken();
                                        if (!token) return;
                                        apiClient.setToken(token);
                                        
                                        const approvedPayment = await apiClient.updatePayment(selectedPayment.id, {
                                          status: 'paid',
                                          paidDate: result.value.paidDate,
                                          receiptDate: result.value.receiptDate,
                                          paymentMethod: result.value.paymentMethod,
                                        });
                                        
                                        // Reload payment to get updated receiptNumber
                                        // Wait a bit for backend to process
                                        await new Promise(resolve => setTimeout(resolve, 500));
                                        const updatedPayment = await apiClient.getPayment(selectedPayment.id);
                                        setPaymentsRefreshKey(prev => prev + 1);
                                        
                                        // Generate receipt automatically
                                        if (updatedPayment && contract) {
                                          const asset = allAssets.find((a: Asset) => a.id === contract.assetId);
                                          if (asset) {
                                            // Update selected payment with fresh data
                                            setSelectedPayment(updatedPayment);
                                            
                                            // Show success message first
                                            await Swal.fire({
                                              icon: 'success',
                                              title: 'อนุมัติเรียบร้อย',
                                              text: 'การชำระเงินได้รับการอนุมัติแล้ว กำลังเปิดใบเสร็จรับเงิน...',
                                              timer: 1500,
                                              showConfirmButton: false,
                                            });
                                            
                                            // Generate and open receipt with updated payment data
                                            setTimeout(() => {
                                              generateReceiptDocument(updatedPayment, contract, asset);
                                            }, 300);
                                          }
                                        } else {
                                          await Swal.fire({
                                            icon: 'success',
                                            title: 'อนุมัติเรียบร้อย',
                                            text: 'การชำระเงินได้รับการอนุมัติแล้ว',
                                            timer: 2000,
                                            showConfirmButton: false,
                                          });
                                        }
                                      } catch (error: any) {
                                        await Swal.fire({
                                          icon: 'error',
                                          title: 'เกิดข้อผิดพลาด',
                                          text: error.message || 'ไม่สามารถอนุมัติการชำระเงินได้',
                                        });
                                      }
                                    }
                                  }}
                                  >
                                    อนุมัติ
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    variant="bordered"
                                    className="flex-1"
                                    onPress={async () => {
                                      const result = await Swal.fire({
                                        title: 'ปฏิเสธการชำระเงิน',
                                        html: `
                                          <div style="text-align: left;">
                                            <p style="margin-bottom: 15px;">จำนวนเงิน: <strong>${formatCurrency(selectedPayment.amount)}</strong></p>
                                            <div style="margin-bottom: 15px;">
                                              <label style="display: block; margin-bottom: 5px; font-weight: 600;">เหตุผลในการปฏิเสธ (ไม่บังคับ):</label>
                                              <textarea id="rejectionReason" rows="3" placeholder="ระบุเหตุผลในการปฏิเสธ (ถ้ามี)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit;"></textarea>
                                            </div>
                                          </div>
                                        `,
                                        showCancelButton: true,
                                        confirmButtonText: 'ปฏิเสธ',
                                        cancelButtonText: 'ยกเลิก',
                                        confirmButtonColor: '#ef4444',
                                        cancelButtonColor: '#6b7280',
                                        icon: 'warning',
                                        preConfirm: () => {
                                          const rejectionReason = (document.getElementById('rejectionReason') as HTMLTextAreaElement)?.value || '';
                                          return { rejectionReason };
                                        },
                                      });
                                      
                                      if (result.isConfirmed && result.value) {
                                        try {
                                          const token = getStoredToken();
                                          if (!token) return;
                                          apiClient.setToken(token);
                                          
                                          await apiClient.updatePayment(selectedPayment.id, {
                                            status: 'pending',
                                            rejectionReason: result.value.rejectionReason,
                                          });
                                          
                                          setPaymentsRefreshKey(prev => prev + 1);
                                          
                                          // Reload payment to get updated status
                                          const updatedPayment = await apiClient.getPayment(selectedPayment.id);
                                          setSelectedPayment(updatedPayment);
                                          
                                          await Swal.fire({
                                            icon: 'success',
                                            title: 'ปฏิเสธเรียบร้อย',
                                            text: 'การชำระเงินถูกปฏิเสธแล้ว และได้แจ้งเตือนผู้เช่าแล้ว',
                                            timer: 2000,
                                            showConfirmButton: false,
                                          });
                                        } catch (error: any) {
                                          await Swal.fire({
                                            icon: 'error',
                                            title: 'เกิดข้อผิดพลาด',
                                            text: error.message || 'ไม่สามารถปฏิเสธการชำระเงินได้',
                                          });
                                        }
                                      }
                                    }}
                                  >
                                    ปฏิเสธ
                                  </Button>
                                </div>
                              )}
                              {selectedPayment.status === 'paid' && contract && (
                                <Button
                                  size="sm"
                                  color="success"
                                  variant="bordered"
                                  startContent={<ArrowDownTrayIcon className="w-4 h-4" />}
                                  className="w-full"
                                  onPress={async () => {
                                    const asset = allAssets.find((a: Asset) => a.id === contract.assetId);
                                    if (asset) {
                                      await generateReceiptDocument(selectedPayment, contract, asset);
                                    }
                                  }}
                                >
                                  พิมพ์ใบเสร็จรับเงิน
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="bordered"
                                className="w-full"
                                onPress={() => {
                                  setSelectedPayment(null);
                                  setTempProofImages([]); // Reset temp images when closing
                                }}
                              >
                                ปิด
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: การแจ้งซ่อม */}
              {activeTab === 'maintenance' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">รายการแจ้งซ่อม</h4>
                    {user?.role === 'tenant' && (
                      <Button
                        size="sm"
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={async () => {
                          const { value: formData } = await Swal.fire({
                            title: 'แจ้งซ่อม',
                            html: `
                              <div style="text-align: left;">
                                <style>
                                  .swal2-form-group {
                                    margin-bottom: 1.5rem;
                                  }
                                  .swal2-form-label {
                                    display: block;
                                    margin-bottom: 0.5rem;
                                    font-weight: 600;
                                    color: #374151;
                                    font-size: 14px;
                                  }
                                  .swal2-form-input, .swal2-form-select, .swal2-form-textarea {
                                    width: 100%;
                                    padding: 0.75rem;
                                    border: 1px solid #d1d5db;
                                    border-radius: 0.5rem;
                                    font-size: 14px;
                                    box-sizing: border-box;
                                  }
                                  .swal2-form-input:focus, .swal2-form-select:focus, .swal2-form-textarea:focus {
                                    outline: none;
                                    border-color: #3b82f6;
                                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                  }
                                  .swal2-form-textarea {
                                    resize: vertical;
                                    min-height: 100px;
                                  }
                                </style>
                                <div class="swal2-form-group">
                                  <label class="swal2-form-label">หัวข้อ *</label>
                                  <input id="swal-title" type="text" class="swal2-form-input" placeholder="เช่น น้ำรั่ว, ไฟไม่ติด" required>
                                </div>
                                <div class="swal2-form-group">
                                  <label class="swal2-form-label">ประเภท *</label>
                                  <select id="swal-type" class="swal2-form-select" required>
                                    <option value="">เลือกประเภท</option>
                                    <option value="repair">ซ่อมแซม</option>
                                    <option value="routine">บำรุงรักษา</option>
                                    <option value="emergency">ฉุกเฉิน</option>
                                  </select>
                                </div>
                                <div class="swal2-form-group">
                                  <label class="swal2-form-label">รายละเอียด *</label>
                                  <textarea id="swal-description" class="swal2-form-textarea" placeholder="อธิบายปัญหาหรือสิ่งที่ต้องการซ่อม" required></textarea>
                                </div>
                              </div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'แจ้งซ่อม',
                            cancelButtonText: 'ยกเลิก',
                            confirmButtonColor: '#3b82f6',
                            cancelButtonColor: '#6b7280',
                            preConfirm: () => {
                              const title = (document.getElementById('swal-title') as HTMLInputElement)?.value;
                              const type = (document.getElementById('swal-type') as HTMLSelectElement)?.value;
                              const description = (document.getElementById('swal-description') as HTMLTextAreaElement)?.value;
                              
                              if (!title || !type || !description) {
                                Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
                                return false;
                              }
                              
                              return { title, type, description };
                            },
                          });
                          
                          if (formData) {
                            try {
                              const token = getStoredToken();
                              if (!token) {
                                await Swal.fire({
                                  icon: 'error',
                                  title: 'เกิดข้อผิดพลาด',
                                  text: 'กรุณาเข้าสู่ระบบใหม่',
                                });
                                return;
                              }
                              apiClient.setToken(token);
                              
                              await apiClient.createMaintenance({
                                assetId: selectedAsset!.id,
                                type: formData.type as 'repair' | 'routine' | 'emergency',
                                title: formData.title,
                                description: formData.description,
                                cost: 0,
                              });
                              
                              await Swal.fire({
                                icon: 'success',
                                title: 'แจ้งซ่อมเรียบร้อย',
                                text: 'ได้แจ้งซ่อมเรียบร้อยแล้ว และได้แจ้งเตือนเจ้าของทรัพย์สินแล้ว',
                                timer: 2000,
                                showConfirmButton: false,
                              });
                              
                              setAssetsRefreshKey(prev => prev + 1);
                              window.dispatchEvent(new CustomEvent('refreshDashboard'));
                            } catch (error: any) {
                              console.error('Error creating maintenance:', error);
                              await Swal.fire({
                                icon: 'error',
                                title: 'เกิดข้อผิดพลาด',
                                text: error.message || 'ไม่สามารถแจ้งซ่อมได้',
                              });
                            }
                          }
                        }}
                      >
                        แจ้งซ่อม
                      </Button>
                    )}
                  </div>
                  {assetMaintenance.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>ยังไม่มีรายการแจ้งซ่อม</p>
                      {user?.role === 'tenant' && (
                        <Button
                          size="sm"
                          color="primary"
                          className="mt-4"
                          startContent={<PlusIcon className="w-4 h-4" />}
                          onPress={async () => {
                            const { value: formData } = await Swal.fire({
                              title: 'แจ้งซ่อม',
                              html: `
                                <div style="text-align: left;">
                                  <style>
                                    .swal2-form-group {
                                      margin-bottom: 1.5rem;
                                    }
                                    .swal2-form-label {
                                      display: block;
                                      margin-bottom: 0.5rem;
                                      font-weight: 600;
                                      color: #374151;
                                      font-size: 14px;
                                    }
                                    .swal2-form-input, .swal2-form-select, .swal2-form-textarea {
                                      width: 100%;
                                      padding: 0.75rem;
                                      border: 1px solid #d1d5db;
                                      border-radius: 0.5rem;
                                      font-size: 14px;
                                      box-sizing: border-box;
                                    }
                                    .swal2-form-input:focus, .swal2-form-select:focus, .swal2-form-textarea:focus {
                                      outline: none;
                                      border-color: #3b82f6;
                                      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                    }
                                    .swal2-form-textarea {
                                      resize: vertical;
                                      min-height: 100px;
                                    }
                                  </style>
                                  <div class="swal2-form-group">
                                    <label class="swal2-form-label">หัวข้อ *</label>
                                    <input id="swal-title" type="text" class="swal2-form-input" placeholder="เช่น น้ำรั่ว, ไฟไม่ติด" required>
                                  </div>
                                  <div class="swal2-form-group">
                                    <label class="swal2-form-label">ประเภท *</label>
                                    <select id="swal-type" class="swal2-form-select" required>
                                      <option value="">เลือกประเภท</option>
                                      <option value="repair">ซ่อมแซม</option>
                                      <option value="routine">บำรุงรักษา</option>
                                      <option value="emergency">ฉุกเฉิน</option>
                                    </select>
                                  </div>
                                  <div class="swal2-form-group">
                                    <label class="swal2-form-label">รายละเอียด *</label>
                                    <textarea id="swal-description" class="swal2-form-textarea" placeholder="อธิบายปัญหาหรือสิ่งที่ต้องการซ่อม" required></textarea>
                                  </div>
                                </div>
                              `,
                              showCancelButton: true,
                              confirmButtonText: 'แจ้งซ่อม',
                              cancelButtonText: 'ยกเลิก',
                              confirmButtonColor: '#3b82f6',
                              cancelButtonColor: '#6b7280',
                              preConfirm: () => {
                                const title = (document.getElementById('swal-title') as HTMLInputElement)?.value;
                                const type = (document.getElementById('swal-type') as HTMLSelectElement)?.value;
                                const description = (document.getElementById('swal-description') as HTMLTextAreaElement)?.value;
                                
                                if (!title || !type || !description) {
                                  Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
                                  return false;
                                }
                                
                                return { title, type, description };
                              },
                            });
                            
                            if (formData) {
                              try {
                                const token = getStoredToken();
                                if (!token) {
                                  await Swal.fire({
                                    icon: 'error',
                                    title: 'เกิดข้อผิดพลาด',
                                    text: 'กรุณาเข้าสู่ระบบใหม่',
                                  });
                                  return;
                                }
                                apiClient.setToken(token);
                                
                                await apiClient.createMaintenance({
                                  assetId: selectedAsset!.id,
                                  type: formData.type as 'repair' | 'routine' | 'emergency',
                                  title: formData.title,
                                  description: formData.description,
                                  cost: 0,
                                });
                                
                                await Swal.fire({
                                  icon: 'success',
                                  title: 'แจ้งซ่อมเรียบร้อย',
                                  text: 'ได้แจ้งซ่อมเรียบร้อยแล้ว และได้แจ้งเตือนเจ้าของทรัพย์สินแล้ว',
                                  timer: 2000,
                                  showConfirmButton: false,
                                });
                                
                                setAssetsRefreshKey(prev => prev + 1);
                                window.dispatchEvent(new CustomEvent('refreshDashboard'));
                              } catch (error: any) {
                                console.error('Error creating maintenance:', error);
                                await Swal.fire({
                                  icon: 'error',
                                  title: 'เกิดข้อผิดพลาด',
                                  text: error.message || 'ไม่สามารถแจ้งซ่อมได้',
                                });
                              }
                            }
                          }}
                        >
                          แจ้งซ่อมแรก
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assetMaintenance.map((item) => (
                        <Card key={item.id} className="shadow-sm">
                          <CardBody className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                                  <p className="text-xs text-gray-500 mt-1">รายงานโดย: {item.reportedByName}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : item.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-700'
                                    : item.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {item.status === 'completed' ? 'เสร็จสิ้น' : 
                                   item.status === 'in_progress' ? 'กำลังดำเนินการ' : 
                                   item.status === 'cancelled' ? 'ยกเลิก' : 
                                   'รอดำเนินการ'}
                                </span>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500">รายละเอียด</p>
                                <p className="text-sm text-gray-800 mt-1">{item.description}</p>
                              </div>
                              
                              {item.scheduledDate && (
                                <div>
                                  <p className="text-xs text-gray-500">วันที่นัดหมาย</p>
                                  <p className="text-sm font-medium text-gray-800 mt-1">
                                    {new Date(item.scheduledDate).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              )}
                              
                              {item.completedDate && (
                                <div>
                                  <p className="text-xs text-gray-500">วันที่เสร็จสิ้น</p>
                                  <p className="text-sm font-medium text-gray-800 mt-1">
                                    {new Date(item.completedDate).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                <div>
                                  <p className="text-xs text-gray-500">ค่าใช้จ่าย</p>
                                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(item.cost)}</p>
                                </div>
                              </div>
                              
                              {/* Action buttons for owner */}
                              {(user?.role === 'owner' || user?.role === 'admin') && (
                                <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                                  {item.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      color="primary"
                                      className="w-full"
                                      onPress={async () => {
                                        const { value: formData } = await Swal.fire({
                                          title: 'รับเรื่องการซ่อม',
                                          html: `
                                            <div style="text-align: left;">
                                              <style>
                                                .swal2-form-group {
                                                  margin-bottom: 1.5rem;
                                                }
                                                .swal2-form-label {
                                                  display: block;
                                                  margin-bottom: 0.5rem;
                                                  font-weight: 600;
                                                  color: #374151;
                                                  font-size: 14px;
                                                }
                                                .swal2-form-input {
                                                  width: 100%;
                                                  padding: 0.75rem;
                                                  border: 1px solid #d1d5db;
                                                  border-radius: 0.5rem;
                                                  font-size: 14px;
                                                  box-sizing: border-box;
                                                }
                                                .swal2-form-input:focus {
                                                  outline: none;
                                                  border-color: #3b82f6;
                                                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                                }
                                                .swal2-form-textarea {
                                                  width: 100%;
                                                  padding: 0.75rem;
                                                  border: 1px solid #d1d5db;
                                                  border-radius: 0.5rem;
                                                  font-size: 14px;
                                                  box-sizing: border-box;
                                                  resize: vertical;
                                                  min-height: 80px;
                                                }
                                                .swal2-form-textarea:focus {
                                                  outline: none;
                                                  border-color: #3b82f6;
                                                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                                }
                                              </style>
                                              <div class="swal2-form-group">
                                                <label class="swal2-form-label">วันที่นัดหมายซ่อม *</label>
                                                <input id="swal-scheduledDate" type="date" class="swal2-form-input" value="${item.scheduledDate || ''}" required>
                                              </div>
                                              <div class="swal2-form-group">
                                                <label class="swal2-form-label">ช่วงเวลาที่จะเข้าไปซ่อม (ไม่บังคับ)</label>
                                                <input id="swal-timeRange" type="text" class="swal2-form-input" placeholder="เช่น 09:00 - 12:00 หรือ เช้า 9-12 น.">
                                              </div>
                                              <div class="swal2-form-group">
                                                <label class="swal2-form-label">หมายเหตุเพิ่มเติม (ไม่บังคับ)</label>
                                                <textarea id="swal-notes" class="swal2-form-textarea" placeholder="เช่น กรุณาเตรียมพื้นที่ให้พร้อม หรือ ติดต่อล่วงหน้า"></textarea>
                                              </div>
                                            </div>
                                          `,
                                          showCancelButton: true,
                                          confirmButtonText: 'รับเรื่อง',
                                          cancelButtonText: 'ยกเลิก',
                                          confirmButtonColor: '#3b82f6',
                                          cancelButtonColor: '#6b7280',
                                          preConfirm: () => {
                                            const scheduledDate = (document.getElementById('swal-scheduledDate') as HTMLInputElement)?.value;
                                            const timeRange = (document.getElementById('swal-timeRange') as HTMLInputElement)?.value;
                                            const notes = (document.getElementById('swal-notes') as HTMLTextAreaElement)?.value;
                                            
                                            if (!scheduledDate) {
                                              Swal.showValidationMessage('กรุณาระบุวันที่นัดหมาย');
                                              return false;
                                            }
                                            
                                            return {
                                              scheduledDate,
                                              timeRange: timeRange || undefined,
                                              notes: notes || undefined,
                                            };
                                          },
                                        });
                                        
                                        if (formData) {
                                          try {
                                            const token = getStoredToken();
                                            if (!token) return;
                                            apiClient.setToken(token);
                                            
                                            const updatedMaintenance = await apiClient.updateMaintenance(item.id, {
                                              status: 'in_progress',
                                              scheduledDate: formData.scheduledDate,
                                            });
                                          
                                          if (updatedMaintenance) {
                                            await Swal.fire({
                                              icon: 'success',
                                              title: 'รับเรื่องเรียบร้อย',
                                              html: `ได้รับเรื่องการซ่อมแล้ว และได้แจ้งเตือนผู้เช่าแล้ว${formData.timeRange ? `<br>ช่วงเวลา: ${formData.timeRange}` : ''}${formData.notes ? `<br>หมายเหตุ: ${formData.notes}` : ''}`,
                                              timer: 3000,
                                              showConfirmButton: false,
                                            });
                                            
                                            // Refresh maintenance list
                                            setAssetsRefreshKey(prev => prev + 1);
                                            // Trigger dashboard refresh
                                            window.dispatchEvent(new CustomEvent('refreshDashboard'));
                                            }
                                          } catch (error: any) {
                                            await Swal.fire({
                                              icon: 'error',
                                              title: 'เกิดข้อผิดพลาด',
                                              text: error.message || 'ไม่สามารถรับเรื่องได้',
                                            });
                                          }
                                        }
                                      }}
                                    >
                                      รับเรื่อง
                                    </Button>
                                  )}
                                  
                                  {(item.status === 'in_progress' || item.status === 'pending') && (
                                    <Button
                                      size="sm"
                                      color="success"
                                      className="w-full"
                                      onPress={async () => {
                                        const result = await Swal.fire({
                                          icon: 'question',
                                          title: 'ปิดงานการซ่อม',
                                          text: `ต้องการปิดงาน "${item.title}" หรือไม่?`,
                                          showCancelButton: true,
                                          confirmButtonText: 'ปิดงาน',
                                          cancelButtonText: 'ยกเลิก',
                                          confirmButtonColor: '#10b981',
                                          cancelButtonColor: '#6b7280',
                                        });
                                        
                                        if (result.isConfirmed) {
                                          try {
                                            const token = getStoredToken();
                                            if (!token) return;
                                            apiClient.setToken(token);
                                            
                                            const updatedMaintenance = await apiClient.updateMaintenance(item.id, {
                                            status: 'completed',
                                            completedDate: new Date().toISOString().split('T')[0],
                                          });
                                          
                                          if (updatedMaintenance) {
                                            await Swal.fire({
                                              icon: 'success',
                                              title: 'ปิดงานเรียบร้อย',
                                              text: 'การซ่อมเสร็จสิ้นแล้ว และได้แจ้งเตือนผู้เช่าแล้ว',
                                              timer: 2000,
                                              showConfirmButton: false,
                                            });
                                            
                                            // Refresh maintenance list
                                            setAssetsRefreshKey(prev => prev + 1);
                                            // Trigger dashboard refresh
                                            window.dispatchEvent(new CustomEvent('refreshDashboard'));
                                            }
                                          } catch (error: any) {
                                            await Swal.fire({
                                              icon: 'error',
                                              title: 'เกิดข้อผิดพลาด',
                                              text: error.message || 'ไม่สามารถปิดงานได้',
                                            });
                                          }
                                        }
                                      }}
                                    >
                                      ปิดงาน
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: ห้องเช่า (สำหรับ Parent Asset) */}
              {activeTab === 'units' && (
                    <div>
                      {!selectedAsset.isParent ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="mb-2">ทรัพย์สินนี้ไม่ใช่ที่ดินหลัก</p>
                          <p className="text-sm">Tab ห้องเช่าใช้สำหรับที่ดินหลักที่พัฒนาเป็นห้องเช่าหลายห้องเท่านั้น</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-800">ห้องเช่า</h4>
                            {(user?.role === 'owner' || user?.role === 'admin') && (
                              <Button
                                size="sm"
                                color="primary"
                                startContent={<PlusIcon className="w-4 h-4" />}
                                onPress={handleCreateUnits}
                              >
                                สร้างห้องเช่า
                              </Button>
                            )}
                          </div>

                          {/* Summary Stats */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <Card className="shadow-sm">
                              <CardBody className="p-4">
                                <p className="text-xs text-gray-500 mb-1">จำนวนห้องทั้งหมด</p>
                                <p className="text-2xl font-bold text-gray-800">{selectedAsset.totalUnits || 0}</p>
                              </CardBody>
                            </Card>
                            <Card className="shadow-sm">
                              <CardBody className="p-4">
                                <p className="text-xs text-gray-500 mb-1">อัตราการเช่า</p>
                                <p className="text-2xl font-bold text-blue-600">{getOccupancyRate(selectedAsset.id).toFixed(1)}%</p>
                              </CardBody>
                            </Card>
                            <Card className="shadow-sm col-span-2">
                              <CardBody className="p-4">
                                <p className="text-xs text-gray-500 mb-1">รายได้รวมต่อเดือน</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(getTotalIncomeFromParent(selectedAsset.id))}</p>
                              </CardBody>
                            </Card>
                          </div>

                          {childAssets.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p>ยังไม่มีห้องเช่า</p>
                              <p className="text-xs mt-2 text-gray-400">ไม่พบห้องเช่าที่เกี่ยวข้อง</p>
                              {(user?.role === 'owner' || user?.role === 'admin') && (
                                <Button
                                  size="sm"
                                  color="primary"
                                  className="mt-4"
                                  startContent={<PlusIcon className="w-4 h-4" />}
                                  onPress={handleCreateUnits}
                                >
                                  สร้างห้องเช่าแรก
                                </Button>
                              )}
                            </div>
                          ) : (
                        <div className="space-y-3">
                          {childAssets
                            .sort((a, b) => {
                              // Sort by unitNumber if available
                              if (a.unitNumber && b.unitNumber) {
                                return a.unitNumber.localeCompare(b.unitNumber);
                              }
                              return 0;
                            })
                            .map((unit) => {
                            const unitContracts = allContracts.filter((c: Contract) => c.assetId === unit.id);
                            const unitActiveContract = unitContracts.find(c => c.status === 'active');
                            
                            return (
                              <Card key={unit.id} className="shadow-sm hover:shadow-md transition-shadow">
                                <CardBody className="p-4">
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">
                                          {unit.unitNumber ? `ห้อง ${unit.unitNumber}` : unit.name}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          ขนาด: {unit.size} ตร.ม. | {unit.rooms} ห้องนอน
                                        </p>
                                      </div>
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        unit.status === 'available'
                                          ? 'bg-green-100 text-green-700'
                                          : unit.status === 'rented'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-orange-100 text-orange-700'
                                      }`}>
                                        {getStatusText(unit.status)}
                                      </span>
                                    </div>
                                    {unitActiveContract ? (
                                      <div className="pt-2 border-t border-gray-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                          <p className="text-xs text-gray-500">ผู้เช่า</p>
                                          <p className="text-sm font-medium text-gray-800">{unitActiveContract.tenantName}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <p className="text-xs text-gray-500">ค่าเช่า</p>
                                          <p className="text-sm font-semibold text-blue-600">{formatCurrency(unitActiveContract.rentAmount)}/เดือน</p>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                          <p className="text-gray-500">สัญญาเลขที่</p>
                                          <p className="text-gray-700 font-mono">{unitActiveContract.contractNumber || unitActiveContract.id}</p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="pt-2 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 text-center py-2">ยังไม่มีสัญญาเช่า</p>
                                      </div>
                                    )}
                                    <div className="pt-2 border-t border-gray-100">
                                      <Button
                                        size="sm"
                                        variant="bordered"
                                        className="w-full"
                                        onPress={() => {
                                          setSelectedAsset(unit);
                                          setActiveTab('details');
                                        }}
                                      >
                                        ดูรายละเอียด
                                      </Button>
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>
                          )}
                        </>
                      )}
                    </div>
              )}

              {/* Tab 6: เอกสาร */}
              {activeTab === 'documents' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">เอกสารทรัพย์สิน</h4>
                    {(user?.role === 'owner' || user?.role === 'admin') && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          multiple
                          className="hidden"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            // Show form to enter document name and category
                            const { value: formData } = await Swal.fire({
                              title: 'เพิ่มเอกสาร',
                              html: `
                                <div style="text-align: left;">
                                  <style>
                                    .swal2-form-group {
                                      margin-bottom: 1.5rem;
                                    }
                                    .swal2-form-label {
                                      display: block;
                                      margin-bottom: 0.5rem;
                                      font-weight: 600;
                                      color: #374151;
                                      font-size: 14px;
                                    }
                                    .swal2-form-input, .swal2-form-select {
                                      width: 100%;
                                      padding: 0.75rem;
                                      border: 1px solid #d1d5db;
                                      border-radius: 0.5rem;
                                      font-size: 14px;
                                      box-sizing: border-box;
                                    }
                                    .swal2-form-input:focus, .swal2-form-select:focus {
                                      outline: none;
                                      border-color: #3b82f6;
                                      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                    }
                                    .swal2-file-info {
                                      background-color: #f3f4f6;
                                      padding: 0.75rem;
                                      border-radius: 0.5rem;
                                      margin-bottom: 1rem;
                                      font-size: 13px;
                                      color: #6b7280;
                                    }
                                  </style>
                                  <div class="swal2-file-info">
                                    <strong>ไฟล์ที่เลือก:</strong><br>
                                    ${Array.from(files).map((f, i) => `${i + 1}. ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('<br>')}
                                  </div>
                                  <div class="swal2-form-group">
                                    <label class="swal2-form-label">ชื่อเอกสาร *</label>
                                    <input id="swal-documentName" type="text" class="swal2-form-input" placeholder="เช่น เอกสารโฉนดที่ดิน" required>
                                  </div>
                                  <div class="swal2-form-group">
                                    <label class="swal2-form-label">ประเภทเอกสาร *</label>
                                    <select id="swal-documentCategory" class="swal2-form-select" required>
                                      <option value="">เลือกประเภทเอกสาร</option>
                                      <option value="โฉนด">เอกสารโฉนด (หนังสือแสดงกรรมสิทธิ์)</option>
                                      <option value="สัญญา">เอกสารสัญญา (สัญญาเช่า/ซื้อขาย)</option>
                                      <option value="ภาษี">เอกสารภาษี (ภาษีที่ดิน/อาคาร)</option>
                                      <option value="ประกัน">เอกสารประกัน (ประกันภัยทรัพย์สิน)</option>
                                      <option value="อื่นๆ">อื่นๆ</option>
                                    </select>
                                  </div>
                                </div>
                              `,
                              showCancelButton: true,
                              confirmButtonText: 'อัปโหลด',
                              cancelButtonText: 'ยกเลิก',
                              confirmButtonColor: '#3b82f6',
                              cancelButtonColor: '#6b7280',
                              preConfirm: async () => {
                                const documentName = (document.getElementById('swal-documentName') as HTMLInputElement)?.value;
                                const documentCategory = (document.getElementById('swal-documentCategory') as HTMLSelectElement)?.value;
                                
                                if (!documentName) {
                                  Swal.showValidationMessage('กรุณาระบุชื่อเอกสาร');
                                  return false;
                                }
                                
                                if (!documentCategory) {
                                  Swal.showValidationMessage('กรุณาเลือกประเภทเอกสาร');
                                  return false;
                                }

                                // Convert files to base64
                                const filePromises = Array.from(files).map((file) => {
                                  return new Promise<{ name: string; data: string; type: string }>((resolve, reject) => {
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                      resolve({
                                        name: file.name,
                                        data: e.target?.result as string,
                                        type: file.type || 'application/octet-stream',
                                      });
                                    };
                                    reader.onerror = reject;
                                    reader.readAsDataURL(file);
                                  });
                                });

                                const fileData = await Promise.all(filePromises);
                                
                                return {
                                  documentName,
                                  documentCategory,
                                  files: fileData,
                                };
                              },
                            });

                            if (formData) {
                              // Add documents to asset
                              const currentDocuments = selectedAsset.documents || [];
                              const newDocuments = formData.files.map((file: { name: string; data: string; type: string }, index: number) => {
                                const categoryPrefix = formData.documentCategory ? `${formData.documentCategory}_` : '';
                                const fileName = formData.files.length > 1 
                                  ? `${formData.documentName}_${index + 1}`
                                  : formData.documentName;
                                return `${categoryPrefix}${fileName}|${file.data}`;
                              });

                              try {
                                const token = getStoredToken();
                                if (!token) return;
                                apiClient.setToken(token);
                                
                                const updatedAsset = await apiClient.updateAsset(selectedAsset.id, {
                                documents: [...currentDocuments, ...newDocuments],
                              });

                              if (updatedAsset) {
                                setSelectedAsset(updatedAsset);
                                setAssetsRefreshKey(prev => prev + 1);
                                
                                await Swal.fire({
                                  icon: 'success',
                                  title: 'อัปโหลดสำเร็จ',
                                  text: `อัปโหลดเอกสาร ${formData.files.length} ไฟล์เรียบร้อยแล้ว`,
                                  timer: 2000,
                                  showConfirmButton: false,
                                  });
                                }
                              } catch (error: any) {
                                await Swal.fire({
                                  icon: 'error',
                                  title: 'เกิดข้อผิดพลาด',
                                  text: error.message || 'ไม่สามารถอัปโหลดเอกสารได้',
                                });
                              }
                            }

                            // Reset file input
                            e.target.value = '';
                          }}
                        />
                        <Button
                          size="sm"
                          color="primary"
                          startContent={<PlusIcon className="w-4 h-4" />}
                          as="span"
                        >
                          เพิ่มเอกสาร
                        </Button>
                      </label>
                    )}
                  </div>

                  {selectedAsset.documents && selectedAsset.documents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedAsset.documents.map((doc, index) => {
                        // Parse document: format is "category_name|base64data" or just "name|base64data"
                        const [docInfo, docData] = doc.split('|');
                        const docName = docInfo.includes('_') ? docInfo.split('_').slice(1).join('_') : docInfo;
                        const docCategory = docInfo.includes('_') ? docInfo.split('_')[0] : '';
                        
                        const getCategoryName = (cat: string) => {
                          if (cat === 'โฉนด') return 'เอกสารโฉนด';
                          if (cat === 'สัญญา') return 'เอกสารสัญญา';
                          if (cat === 'ภาษี') return 'เอกสารภาษี';
                          if (cat === 'ประกัน') return 'เอกสารประกัน';
                          return 'เอกสารทรัพย์สิน';
                        };

                        const getCategoryIcon = (cat: string) => {
                          if (cat === 'โฉนด') return '📄';
                          if (cat === 'สัญญา') return '📋';
                          if (cat === 'ภาษี') return '🧾';
                          if (cat === 'ประกัน') return '🛡️';
                          return '📎';
                        };

                        return (
                          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                            <CardBody className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                                    {getCategoryIcon(docCategory)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                      {getCategoryName(docCategory)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 truncate">{docName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="bordered"
                                    onPress={() => {
                                      // Open document in new tab
                                      if (docData) {
                                        const newWindow = window.open();
                                        if (newWindow) {
                                          newWindow.document.write(`
                                            <html>
                                              <head><title>${docName}</title></head>
                                              <body style="margin:0; padding:20px;">
                                                ${docData.startsWith('data:image') 
                                                  ? `<img src="${docData}" style="max-width:100%; height:auto;" />`
                                                  : docData.startsWith('data:application/pdf')
                                                  ? `<iframe src="${docData}" style="width:100%; height:100vh; border:none;"></iframe>`
                                                  : `<embed src="${docData}" style="width:100%; height:100vh;" />`
                                                }
                                              </body>
                                            </html>
                                          `);
                                        }
                                      } else {
                                        window.open(doc, '_blank');
                                      }
                                    }}
                                  >
                                    ดู
                                  </Button>
                                  {(user?.role === 'owner' || user?.role === 'admin') && (
                                    <Button
                                      size="sm"
                                      color="danger"
                                      variant="light"
                                      onPress={async () => {
                                        const result = await Swal.fire({
                                          icon: 'question',
                                          title: 'ลบเอกสาร',
                                          text: `ต้องการลบเอกสาร "${docName}" หรือไม่?`,
                                          showCancelButton: true,
                                          confirmButtonText: 'ลบ',
                                          cancelButtonText: 'ยกเลิก',
                                          confirmButtonColor: '#ef4444',
                                          cancelButtonColor: '#6b7280',
                                        });

                                        if (result.isConfirmed) {
                                          const currentDocuments = selectedAsset.documents || [];
                                          const updatedDocuments = currentDocuments.filter((_, i) => i !== index);
                                          
                                          try {
                                            const token = getStoredToken();
                                            if (!token) return;
                                            apiClient.setToken(token);
                                            
                                            const updatedAsset = await apiClient.updateAsset(selectedAsset.id, {
                                            documents: updatedDocuments,
                                          });

                                          if (updatedAsset) {
                                            setSelectedAsset(updatedAsset);
                                            setAssetsRefreshKey(prev => prev + 1);
                                            
                                            await Swal.fire({
                                              icon: 'success',
                                              title: 'ลบสำเร็จ',
                                              text: 'เอกสารถูกลบเรียบร้อยแล้ว',
                                              timer: 2000,
                                              showConfirmButton: false,
                                            });
                                          }
                                        } catch (error: any) {
                                          await Swal.fire({
                                            icon: 'error',
                                            title: 'เกิดข้อผิดพลาด',
                                            text: error.message || 'ไม่สามารถลบเอกสารได้',
                                            });
                                          }
                                        }
                                      }}
                                    >
                                      ลบ
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="mb-2">ยังไม่มีเอกสาร</p>
                      <p className="text-sm text-gray-400 mb-4">เอกสารที่สามารถเก็บได้ เช่น เอกสารโฉนด, เอกสารสัญญา, เอกสารภาษี, เอกสารประกันภัย</p>
                      {(user?.role === 'owner' || user?.role === 'admin') && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;

                              const { value: formData } = await Swal.fire({
                                title: 'เพิ่มเอกสาร',
                                html: `
                                  <div style="text-align: left;">
                                    <style>
                                      .swal2-form-group {
                                        margin-bottom: 1.5rem;
                                      }
                                      .swal2-form-label {
                                        display: block;
                                        margin-bottom: 0.5rem;
                                        font-weight: 600;
                                        color: #374151;
                                        font-size: 14px;
                                      }
                                      .swal2-form-input, .swal2-form-select {
                                        width: 100%;
                                        padding: 0.75rem;
                                        border: 1px solid #d1d5db;
                                        border-radius: 0.5rem;
                                        font-size: 14px;
                                        box-sizing: border-box;
                                      }
                                      .swal2-form-input:focus, .swal2-form-select:focus {
                                        outline: none;
                                        border-color: #3b82f6;
                                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                                      }
                                      .swal2-file-info {
                                        background-color: #f3f4f6;
                                        padding: 0.75rem;
                                        border-radius: 0.5rem;
                                        margin-bottom: 1rem;
                                        font-size: 13px;
                                        color: #6b7280;
                                      }
                                    </style>
                                    <div class="swal2-file-info">
                                      <strong>ไฟล์ที่เลือก:</strong><br>
                                      ${Array.from(files).map((f, i) => `${i + 1}. ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('<br>')}
                                    </div>
                                    <div class="swal2-form-group">
                                      <label class="swal2-form-label">ชื่อเอกสาร *</label>
                                      <input id="swal-documentName" type="text" class="swal2-form-input" placeholder="เช่น เอกสารโฉนดที่ดิน" required>
                                    </div>
                                    <div class="swal2-form-group">
                                      <label class="swal2-form-label">ประเภทเอกสาร *</label>
                                      <select id="swal-documentCategory" class="swal2-form-select" required>
                                        <option value="">เลือกประเภทเอกสาร</option>
                                        <option value="โฉนด">เอกสารโฉนด (หนังสือแสดงกรรมสิทธิ์)</option>
                                        <option value="สัญญา">เอกสารสัญญา (สัญญาเช่า/ซื้อขาย)</option>
                                        <option value="ภาษี">เอกสารภาษี (ภาษีที่ดิน/อาคาร)</option>
                                        <option value="ประกัน">เอกสารประกัน (ประกันภัยทรัพย์สิน)</option>
                                        <option value="อื่นๆ">อื่นๆ</option>
                                      </select>
                                    </div>
                                  </div>
                                `,
                                showCancelButton: true,
                                confirmButtonText: 'อัปโหลด',
                                cancelButtonText: 'ยกเลิก',
                                confirmButtonColor: '#3b82f6',
                                cancelButtonColor: '#6b7280',
                                preConfirm: async () => {
                                  const documentName = (document.getElementById('swal-documentName') as HTMLInputElement)?.value;
                                  const documentCategory = (document.getElementById('swal-documentCategory') as HTMLSelectElement)?.value;
                                  
                                  if (!documentName) {
                                    Swal.showValidationMessage('กรุณาระบุชื่อเอกสาร');
                                    return false;
                                  }
                                  
                                  if (!documentCategory) {
                                    Swal.showValidationMessage('กรุณาเลือกประเภทเอกสาร');
                                    return false;
                                  }

                                  const filePromises = Array.from(files).map((file) => {
                                    return new Promise<{ name: string; data: string; type: string }>((resolve, reject) => {
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        resolve({
                                          name: file.name,
                                          data: e.target?.result as string,
                                          type: file.type || 'application/octet-stream',
                                        });
                                      };
                                      reader.onerror = reject;
                                      reader.readAsDataURL(file);
                                    });
                                  });

                                  const fileData = await Promise.all(filePromises);
                                  
                                  return {
                                    documentName,
                                    documentCategory,
                                    files: fileData,
                                  };
                                },
                              });

                              if (formData) {
                                const currentDocuments = selectedAsset.documents || [];
                                const newDocuments = formData.files.map((file: { name: string; data: string; type: string }, index: number) => {
                                  const categoryPrefix = formData.documentCategory ? `${formData.documentCategory}_` : '';
                                  const fileName = formData.files.length > 1 
                                    ? `${formData.documentName}_${index + 1}`
                                    : formData.documentName;
                                  return `${categoryPrefix}${fileName}|${file.data}`;
                                });

                                try {
                                  const token = getStoredToken();
                                  if (!token) return;
                                  apiClient.setToken(token);
                                  
                                  const updatedAsset = await apiClient.updateAsset(selectedAsset.id, {
                                  documents: [...currentDocuments, ...newDocuments],
                                });

                                if (updatedAsset) {
                                  setSelectedAsset(updatedAsset);
                                  setAssetsRefreshKey(prev => prev + 1);
                                  
                                  await Swal.fire({
                                    icon: 'success',
                                    title: 'อัปโหลดสำเร็จ',
                                    text: `อัปโหลดเอกสาร ${formData.files.length} ไฟล์เรียบร้อยแล้ว`,
                                    timer: 2000,
                                    showConfirmButton: false,
                                    });
                                  }
                                } catch (error: any) {
                                  await Swal.fire({
                                    icon: 'error',
                                    title: 'เกิดข้อผิดพลาด',
                                    text: error.message || 'ไม่สามารถอัปโหลดเอกสารได้',
                                  });
                                }
                              }

                              e.target.value = '';
                            }}
                          />
                          <Button
                            size="sm"
                            color="primary"
                            startContent={<PlusIcon className="w-4 h-4" />}
                            as="span"
                          >
                            เพิ่มเอกสารแรก
                          </Button>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Document Categories */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">ประเภทเอกสารที่แนะนำ</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-700">เอกสารโฉนด</p>
                        </div>
                        <p className="text-xs text-gray-500">หนังสือแสดงกรรมสิทธิ์</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-700">เอกสารสัญญา</p>
                        </div>
                        <p className="text-xs text-gray-500">สัญญาเช่า/ซื้อขาย</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-700">เอกสารภาษี</p>
                        </div>
                        <p className="text-xs text-gray-500">ภาษีที่ดิน/อาคาร</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs font-medium text-gray-700">เอกสารประกัน</p>
                        </div>
                        <p className="text-xs text-gray-500">ประกันภัยทรัพย์สิน</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <Button
                onClick={() => setSelectedAsset(null)}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                ปิด
              </Button>
            </div>
          </div>
        </div>
          )}

    </>
  );
}

