import { UserDB, User, AssetDB, Asset, ContractDB, Contract, PaymentDB, Payment, MaintenanceDB, Maintenance, NotificationDB, Notification } from '../types';

export function transformUser(user: UserDB): User {
  return {
    id: user.id,
    phone: user.phone,
    password: user.password,
    role: user.role,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    address: user.address,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at.toISOString(),
  };
}

export function transformAsset(asset: AssetDB): Asset {
  return {
    id: asset.id,
    ownerId: asset.owner_id,
    type: asset.type,
    name: asset.name,
    address: asset.address,
    district: asset.district,
    amphoe: asset.amphoe,
    province: asset.province,
    postalCode: asset.postal_code,
    size: Number(asset.size),
    rooms: asset.rooms,
    purchasePrice: Number(asset.purchase_price),
    currentValue: Number(asset.current_value),
    status: asset.status,
    images: asset.images || [],
    documents: asset.documents || [],
    latitude: asset.latitude ? Number(asset.latitude) : undefined,
    longitude: asset.longitude ? Number(asset.longitude) : undefined,
    description: asset.description,
    createdAt: asset.created_at.toISOString(),
    updatedAt: asset.updated_at.toISOString(),
    parentAssetId: asset.parent_asset_id,
    isParent: asset.is_parent,
    childAssets: asset.child_assets || [],
    unitNumber: asset.unit_number,
    totalUnits: asset.total_units,
    developmentHistory: asset.development_history,
  };
}

export function transformContract(contract: ContractDB, assetName?: string, tenantName?: string): Contract {
  return {
    id: contract.id,
    contractNumber: contract.contract_number,
    assetId: contract.asset_id,
    assetName,
    tenantId: contract.tenant_id,
    tenantName,
    startDate: contract.start_date.toISOString().split('T')[0],
    endDate: contract.end_date.toISOString().split('T')[0],
    rentAmount: Number(contract.rent_amount),
    deposit: Number(contract.deposit),
    insurance: Number(contract.insurance),
    status: contract.status,
    documents: contract.documents || [],
    notes: contract.notes,
    createdAt: contract.created_at.toISOString(),
    updatedAt: contract.updated_at.toISOString(),
  };
}

export function transformPayment(payment: PaymentDB): Payment {
  return {
    id: payment.id,
    contractId: payment.contract_id,
    amount: Number(payment.amount),
    type: payment.type as Payment['type'],
    dueDate: payment.due_date.toISOString().split('T')[0],
    paidDate: payment.paid_date?.toISOString().split('T')[0],
    status: payment.status,
    proofImages: payment.proof_images || [],
    receiptNumber: payment.receipt_number || undefined,
    receiptDate: payment.receipt_date?.toISOString().split('T')[0],
    paymentMethod: payment.payment_method || undefined,
    rejectionReason: payment.rejection_reason || undefined,
    createdAt: payment.created_at.toISOString(),
    updatedAt: payment.updated_at.toISOString(),
  };
}

export function transformMaintenance(maintenance: MaintenanceDB, assetName?: string, reportedByName?: string): Maintenance {
  return {
    id: maintenance.id,
    assetId: maintenance.asset_id,
    assetName,
    type: maintenance.type,
    title: maintenance.title,
    description: maintenance.description,
    cost: Number(maintenance.cost),
    status: maintenance.status,
    reportedBy: maintenance.reported_by,
    reportedByName,
    scheduledDate: maintenance.scheduled_date?.toISOString().split('T')[0],
    completedDate: maintenance.completed_date?.toISOString().split('T')[0],
    images: maintenance.images || [],
    createdAt: maintenance.created_at.toISOString(),
    updatedAt: maintenance.updated_at.toISOString(),
  };
}

export function transformNotification(notification: NotificationDB): Notification {
  return {
    id: notification.id,
    userId: notification.user_id,
    type: notification.type as Notification['type'],
    title: notification.title,
    message: notification.message,
    relatedId: notification.related_id,
    status: notification.status,
    createdAt: notification.created_at.toISOString(),
    readAt: notification.read_at?.toISOString(),
  };
}

