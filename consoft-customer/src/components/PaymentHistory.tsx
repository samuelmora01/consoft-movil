import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

interface Payment {
  _id: string;
  amount: number;
  paidAt: string;
  method: string;
  status: string;
  receiptUrl?: string;
  reference?: string;
  ocrText?: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
  initialPayment?: {
    amount: number;
    method: string;
    registeredAt?: string;
  };
  onViewReceipt?: (url: string) => void;
}

export default function PaymentHistory({ payments, initialPayment, onViewReceipt }: PaymentHistoryProps) {
  const { theme } = useTheme();

  const getStatusColor = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'aprobado':
      case 'paid':
      case 'confirmado':
        return '#28a745';
      case 'pendiente':
      case 'pending':
      case 'en_revision':
        return '#ffc107';
      case 'rechazado':
      case 'rejected':
        return '#dc3545';
      case 'en_proceso':
      case 'processing':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'aprobado':
      case 'paid':
      case 'confirmado':
        return 'Aprobado';
      case 'pendiente':
      case 'pending':
        return 'Pendiente';
      case 'en_revision':
        return 'En revisión';
      case 'rechazado':
      case 'rejected':
        return 'Rechazado';
      case 'en_proceso':
      case 'processing':
        return 'Procesando';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('es-CO')}`;
  };

  const getMethodLabel = (method: string): string => {
    const normalizedMethod = method.toLowerCase();
    switch (normalizedMethod) {
      case 'cash':
        return 'Efectivo';
      case 'comprobante':
        return 'Comprobante';
      case 'transferencia':
        return 'Transferencia';
      case 'nequi':
        return 'Nequi';
      case 'bancolombia':
        return 'Bancolombia';
      case 'daviplata':
        return 'Daviplata';
      default:
        return method;
    }
  };

  const allPayments = [
    ...(initialPayment ? [{
      _id: 'initial',
      amount: initialPayment.amount,
      paidAt: initialPayment.registeredAt || new Date().toISOString(),
      method: initialPayment.method,
      status: 'aprobado',
      isInitial: true
    }] : []),
    ...payments
  ];

  if (allPayments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Historial de Pagos</Text>
      
      {allPayments.map((payment: any, index) => {
        const statusColor = getStatusColor(payment.status);
        const statusLabel = getStatusLabel(payment.status);
        
        return (
          <View 
            key={payment._id} 
            style={[
              styles.paymentCard, 
              { 
                backgroundColor: theme.colors.card, 
                borderColor: theme.colors.border,
                borderLeftColor: statusColor,
                borderLeftWidth: 4
              }
            ]}
          >
            {/* Header */}
            <View style={styles.paymentHeader}>
              <View style={styles.headerLeft}>
                <Ionicons 
                  name={payment.isInitial ? 'cash-outline' : 'card-outline'} 
                  size={20} 
                  color={theme.colors.primary} 
                />
                <Text style={[styles.paymentTitle, { color: theme.colors.text }]}>
                  {payment.isInitial ? 'Pago inicial' : `Pago #${index}`}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Amount */}
            <View style={styles.paymentRow}>
              <Text style={[styles.label, { color: theme.colors.muted }]}>Monto</Text>
              <Text style={[styles.amount, { color: theme.colors.text }]}>
                {formatCurrency(payment.amount)}
              </Text>
            </View>

            {/* Date */}
            <View style={styles.paymentRow}>
              <Text style={[styles.label, { color: theme.colors.muted }]}>Fecha</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {formatDate(payment.paidAt)}
              </Text>
            </View>

            {/* Method */}
            <View style={styles.paymentRow}>
              <Text style={[styles.label, { color: theme.colors.muted }]}>Método</Text>
              <Text style={[styles.value, { color: theme.colors.text }]}>
                {getMethodLabel(payment.method)}
              </Text>
            </View>

            {/* Reference */}
            {payment.reference && (
              <View style={styles.paymentRow}>
                <Text style={[styles.label, { color: theme.colors.muted }]}>Referencia</Text>
                <Text style={[styles.value, { color: theme.colors.text }]}>
                  {payment.reference}
                </Text>
              </View>
            )}

            {/* Receipt Button */}
            {payment.receiptUrl && onViewReceipt && (
              <TouchableOpacity 
                style={[styles.receiptButton, { borderColor: theme.colors.primary }]}
                onPress={() => onViewReceipt(payment.receiptUrl!)}
              >
                <Ionicons name="document-text-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.receiptButtonText, { color: theme.colors.primary }]}>
                  Ver Comprobante
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  paymentCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
