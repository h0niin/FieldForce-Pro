import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsApi, invoicesApi, paymentsApi, workOrdersApi, tenantPaymentApi, type TenantPaymentConfig } from '@/api/endpoints';
import { TenantPaymentDetails } from '@/components/TenantPaymentDetails';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
const ACCENT = '#4F6BF6';
import { formatCurrency } from '@/utils/format';
import { goBack } from '@/utils/navigation';
import type { Invoice } from '@/types/models';

export default function PaymentScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { id: appointmentId } = useLocalSearchParams<{ id: string }>();
    const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

    const [workOrderId, setWorkOrderId] = useState<string | null>(null);
    const [invoice, setInvoice] = useState<Invoice | null>(null);

    const [status, setStatus] = useState<
        'init' | 'ready' | 'processing' | 'success' | 'error'
    >('init');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Razorpay WebView state
    const [razorpayVisible, setRazorpayVisible] = useState(false);
    const [razorpayHtml, setRazorpayHtml] = useState('');
    const razorpayOrderRef = useRef<{ order_id: string; amount: number } | null>(null);
    const [razorpayUnavailable, setRazorpayUnavailable] = useState(false);

    // UPI QR state
    const [upiConfig, setUpiConfig] = useState<{ configured: boolean; vpa?: string; name?: string } | null>(null);
    const [upiQrVisible, setUpiQrVisible] = useState(false);
    const [tenantConfig, setTenantConfig] = useState<TenantPaymentConfig | null>(null);
    const [transactionRef, setTransactionRef] = useState('');

    // ── Init: load appointment -> work order -> invoice (auto-generate if missing)
    useEffect(() => {
        if (!appointmentId) return;
        const init = async () => {
            try {
                const appRes = await appointmentsApi.getById(appointmentId);
                const woId = appRes.data.data?.work_order_id ?? null;
                setWorkOrderId(woId);

                if (!woId) {
                    setErrorMsg('No work order linked to this appointment');
                    setStatus('error');
                    return;
                }

                // Try to find existing invoice
                const invRes = await invoicesApi.getByWorkOrder(woId);
                let inv = invRes.data.data?.[0] ?? null;

                // Auto-generate invoice from work order / estimate if none exists
                if (!inv) {
                    try {
                        const genRes = await workOrdersApi.generateInvoice(woId);
                        inv = genRes.data.data ?? null;
                    } catch {
                        // Invoice generation may fail (e.g. missing permissions) —
                        // continue to show error so technician knows to contact admin
                    }
                }

                if (inv) {
                    setInvoice(inv);
                    setStatus('ready');

                    // Fetch UPI config in background
                    paymentsApi.getUpiConfig()
                        .then(r => setUpiConfig(r.data.data ?? null))
                        .catch(() => setUpiConfig({ configured: false }));

                    // Fetch Tenant-specific payment settings in background (Step 12)
                    tenantPaymentApi.getPaymentSettings()
                        .then(r => setTenantConfig(r.data.data ?? null))
                        .catch(() => setTenantConfig(null));
                } else {
                    setErrorMsg('Could not generate invoice for this work order');
                    setStatus('error');
                }
            } catch (err: any) {
                const message =
                    err?.response?.data?.message ||
                    (err instanceof Error ? err.message : 'Failed to load payment details');
                setErrorMsg(message);
                setStatus('error');
            }
        };
        init();
    }, [appointmentId]);

    // ── Razorpay online payment ───────────────────────────────────────────────
    const handleOnlinePayment = async () => {
        if (!invoice) return;
        const balance = invoice.total - invoice.paid_amount;

        setStatus('processing');
        try {
            const res = await paymentsApi.createRazorpayOrder({
                amount: balance,
                currency: invoice.currency || 'INR',
                invoice_id: invoice.id,
                appointment_id: appointmentId,
            });

            const { order_id, amount, currency, key_id, mock } = res.data.data!;
            razorpayOrderRef.current = { order_id, amount: balance };

            if (mock) {
                // Mock mode: skip Razorpay WebView, simulate successful payment
                setStatus('ready');
                Alert.alert(
                    'Test Payment',
                    `Simulate a successful payment of ${formatCurrency(balance, invoice.currency)}?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Simulate Success',
                            onPress: async () => {
                                setStatus('processing');
                                try {
                                    await paymentsApi.verifyRazorpayPayment({
                                        razorpay_order_id: order_id,
                                        razorpay_payment_id: `pay_mock_${Date.now()}`,
                                        razorpay_signature: 'mock_signature',
                                        invoice_id: invoice.id,
                                        amount: balance,
                                    });
                                    setStatus('success');
                                } catch (err: any) {
                                    const message =
                                        err?.response?.data?.message ||
                                        (err instanceof Error ? err.message : 'Mock payment failed');
                                    Alert.alert('Error', message);
                                    setStatus('ready');
                                }
                            },
                        },
                    ],
                );
                return;
            }

            const html = buildRazorpayCheckoutHtml({
                keyId: key_id,
                orderId: order_id,
                amount,
                currency,
                invoiceNumber: invoice.invoice_number || 'Payment',
            });
            setRazorpayHtml(html);
            setRazorpayVisible(true);
            setStatus('ready');
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Failed to initiate payment');
            if (message.toLowerCase().includes('not configured')) {
                setRazorpayUnavailable(true);
            }
            Alert.alert('Payment Error', message);
            setStatus('ready');
        }
    };

    const handleRazorpayMessage = async (event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.event === 'payment.success') {
                setRazorpayVisible(false);
                setStatus('processing');

                await paymentsApi.verifyRazorpayPayment({
                    razorpay_order_id: data.razorpay_order_id,
                    razorpay_payment_id: data.razorpay_payment_id,
                    razorpay_signature: data.razorpay_signature,
                    invoice_id: invoice!.id,
                    amount: razorpayOrderRef.current?.amount ?? 0,
                });

                setStatus('success');
            } else if (data.event === 'payment.failed') {
                setRazorpayVisible(false);
                setStatus('ready');
                Alert.alert('Payment Failed', data.description || 'The payment could not be processed. Please try again.');
            } else if (data.event === 'payment.dismiss') {
                setRazorpayVisible(false);
                setStatus('ready');
            }
        } catch (err: any) {
            setRazorpayVisible(false);
            const message =
                err?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Payment verification failed');
            Alert.alert('Payment Error', message);
            setStatus('ready');
        }
    };

    // ── UPI QR payment ────────────────────────────────────────────────────────
    const handleUpiPayment = () => {
        if (!invoice || !upiConfig?.configured) return;
        setUpiQrVisible(true);
    };

    const handleUpiConfirm = async (transactionRef: string) => {
        if (!invoice) return;
        const balance = invoice.total - invoice.paid_amount;
        setUpiQrVisible(false);
        setStatus('processing');
        try {
            await paymentsApi.create({
                invoice_id: invoice.id,
                amount: balance,
                method: 'online',
                gateway_transaction_id: transactionRef || `upi_${Date.now()}`,
                status: 'completed',
                paid_at: new Date().toISOString(),
                notes: 'Payment collected via UPI',
            });
            setStatus('success');
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                (err instanceof Error ? err.message : 'Failed to record UPI payment');
            Alert.alert('Error', message);
            setStatus('ready');
        }
    };

    // ── Cash payment ──────────────────────────────────────────────────────────
    const handleCashPayment = async () => {
        if (!invoice) return;
        const balance = invoice.total - invoice.paid_amount;
        Alert.alert(
            'Confirm Cash Payment',
            `Record a cash payment of ${formatCurrency(balance, invoice.currency)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        setStatus('processing');
                        try {
                            await paymentsApi.create({
                                invoice_id: invoice.id,
                                amount: balance,
                                method: 'cash',
                                notes: 'Cash payment collected on-site',
                            });
                            setStatus('success');
                        } catch (err: any) {
                            const message =
                                err?.response?.data?.message ||
                                (err instanceof Error ? err.message : 'Failed to record payment');
                            Alert.alert('Error', message);
                            setStatus('ready');
                        }
                    },
                },
            ],
        );
    };

    // ── Render: success ───────────────────────────────────────────────────────
    if (status === 'success') {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                <Ionicons name="checkmark-circle" size={80} color={themeColors.success} />
                <Text style={styles.successTitle}>Payment Successful!</Text>
                <Text style={[styles.successSubtitle, { color: themeColors.textSecondary }]}>The transaction has been recorded.</Text>
                <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => router.replace(`/appointment/${appointmentId}`)}
                >
                    <Text style={styles.doneButtonText}>Back to Appointment</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Render: init loading ──────────────────────────────────────────────────
    if (status === 'init') {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                <ActivityIndicator size="large" color={ACCENT} />
                <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>Loading invoice...</Text>
            </View>
        );
    }

    // ── Render: error ─────────────────────────────────────────────────────────
    if (status === 'error') {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                <Ionicons name="alert-circle" size={60} color={themeColors.error} />
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Render: main payment screen (invoice exists) ──────────────────────────
    const balance = invoice ? invoice.total - invoice.paid_amount : 0;
    const hasTenantUpi = !!tenantConfig?.upi_vpa;
    const hasTenantQrImage = !!tenantConfig?.qr_image_url;
    const hasTenantBank = !!(tenantConfig?.bank_account_number || tenantConfig?.bank_account_name);
    const hasTenantInstructions = !!tenantConfig?.instructions;
    const isUpiOrQrConfigured = hasTenantUpi || hasTenantQrImage || hasTenantBank || hasTenantInstructions || !!upiConfig?.configured;

    return (
        <>
            <ScrollView
                style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
                ]}
            >
                <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                </TouchableOpacity>

                <Text style={[styles.title, { color: themeColors.text }]}>Collect Payment</Text>

                {invoice && (
                    <View style={[styles.invoiceCard, { backgroundColor: cardBg, borderColor }]}>
                        <Text style={[styles.invoiceNumber, { color: themeColors.textSecondary }]}>{invoice.invoice_number}</Text>

                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Subtotal</Text>
                            <Text style={[styles.detailValue, { color: themeColors.text }]}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
                        </View>
                        {Number(invoice.tax) > 0 && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Tax</Text>
                                <Text style={[styles.detailValue, { color: themeColors.text }]}>{formatCurrency(invoice.tax, invoice.currency)}</Text>
                            </View>
                        )}
                        {Number(invoice.discount) > 0 && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Discount</Text>
                                <Text style={[styles.detailValue, { color: themeColors.success }]}>-{formatCurrency(invoice.discount, invoice.currency)}</Text>
                            </View>
                        )}

                        <View style={[styles.totalDivider, { backgroundColor: themeColors.border }]} />

                        <View style={styles.detailRow}>
                            <Text style={[styles.totalLabel, { color: themeColors.text }]}>Total</Text>
                            <Text style={[styles.totalValue, { color: themeColors.text }]}>{formatCurrency(invoice.total, invoice.currency)}</Text>
                        </View>
                        {Number(invoice.paid_amount) > 0 && (
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>Paid</Text>
                                <Text style={[styles.detailValue, { color: themeColors.success }]}>{formatCurrency(invoice.paid_amount, invoice.currency)}</Text>
                            </View>
                        )}

                        <View style={[styles.balanceRow, { borderTopColor: themeColors.border }]}>
                            <Text style={styles.balanceLabel}>Balance Due</Text>
                            <Text style={styles.balanceValue}>
                                {formatCurrency(balance, invoice.currency)}
                            </Text>
                        </View>
                    </View>
                )}

                {status === 'processing' ? (
                    <View style={[styles.statusBox, { backgroundColor: cardBg, borderColor }]}>
                        <ActivityIndicator size="large" color={ACCENT} />
                        <Text style={[styles.statusText, { color: themeColors.textSecondary }]}>Processing payment...</Text>
                    </View>
                ) : (
                    <View style={styles.paymentOptions}>
                        {/* Online payment via Razorpay */}
                        <TouchableOpacity
                            style={[styles.payButton, razorpayUnavailable && styles.payButtonDisabled]}
                            onPress={handleOnlinePayment}
                            disabled={razorpayUnavailable}
                        >
                            <Ionicons name="globe-outline" size={22} color={razorpayUnavailable ? colors.textSecondary : colors.textInverse} />
                            <Text style={[styles.payButtonText, razorpayUnavailable && { color: colors.textSecondary }]}>
                                Pay Online
                            </Text>
                        </TouchableOpacity>
                        {razorpayUnavailable && (
                            <Text style={styles.razorpayNote}>
                                Online payment is not configured. Please use Cash payment or contact admin.
                            </Text>
                        )}

                        {/* UPI QR Payment */}
                        {isUpiOrQrConfigured && (
                            <TouchableOpacity style={[styles.upiButton, { borderColor: '#6739B7' + '40', backgroundColor: '#6739B7' + '08' }]} onPress={handleUpiPayment}>
                                <Ionicons name="qr-code-outline" size={22} color="#6739B7" />
                                <Text style={[styles.upiButtonText, { color: '#6739B7' }]}>Pay via UPI / QR Code</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.dividerRow}>
                            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
                            <Text style={[styles.dividerText, { color: themeColors.textSecondary }]}>OR</Text>
                            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
                        </View>

                        {/* Cash payment */}
                        <TouchableOpacity style={styles.cashButton} onPress={handleCashPayment}>
                            <Ionicons name="cash-outline" size={22} color={themeColors.success} />
                            <Text style={styles.cashButtonText}>Collect Cash</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Razorpay Checkout WebView Modal */}
            <Modal
                visible={razorpayVisible}
                animationType="slide"
                onRequestClose={() => {
                    setRazorpayVisible(false);
                    setStatus('ready');
                }}
            >
                <View style={[styles.webviewContainer, { paddingTop: insets.top, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                    <View style={[styles.webviewHeader, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                        <TouchableOpacity
                            onPress={() => {
                                setRazorpayVisible(false);
                                setStatus('ready');
                            }}
                        >
                            <Ionicons name="close" size={28} color={themeColors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.webviewTitle, { color: themeColors.text }]}>Complete Payment</Text>
                        <View style={{ width: 28 }} />
                    </View>
                    <WebView
                        source={{ html: razorpayHtml }}
                        onMessage={handleRazorpayMessage}
                        javaScriptEnabled
                        domStorageEnabled
                        startInLoadingState
                        renderLoading={() => (
                            <View style={[styles.centered, StyleSheet.absoluteFill]}>
                                <ActivityIndicator size="large" color={ACCENT} />
                            </View>
                        )}
                    />
                </View>
            </Modal>

            {/* UPI QR Code Modal */}
            <Modal
                visible={upiQrVisible}
                animationType="slide"
                onRequestClose={() => {
                    setUpiQrVisible(false);
                    setTransactionRef('');
                }}
            >
                <View style={[styles.webviewContainer, { paddingTop: insets.top, backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
                    <View style={[styles.webviewHeader, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
                        <TouchableOpacity onPress={() => {
                            setUpiQrVisible(false);
                            setTransactionRef('');
                        }}>
                            <Ionicons name="close" size={28} color={themeColors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.webviewTitle, { color: themeColors.text }]}>QR Code Payment</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {invoice && (
                        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
                            {/* If tenant config has details configured, show TenantPaymentDetails */}
                            {tenantConfig && (tenantConfig.upi_vpa || tenantConfig.qr_image_url || tenantConfig.bank_account_number || tenantConfig.instructions) ? (
                                <TenantPaymentDetails amount={balance} note={invoice.invoice_number} />
                            ) : upiConfig?.vpa ? (
                                /* Fallback to system-wide default UPI QR */
                                <View style={[styles.invoiceCard, { backgroundColor: cardBg, borderColor, alignItems: 'center', gap: spacing.sm }]}>
                                    <Text style={[styles.invoiceNumber, { color: themeColors.textSecondary }]}>SCAN TO PAY</Text>
                                    <Image
                                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(upiConfig.vpa)}&pn=${encodeURIComponent(upiConfig.name || 'FieldForce Pro')}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoice.invoice_number)}`)}` }}
                                        style={{ width: 220, height: 220 }}
                                        resizeMode="contain"
                                    />
                                    <Text style={{ ...typography.body, color: themeColors.text, fontWeight: '700' }}>{upiConfig.name || 'FieldForce Pro'}</Text>
                                    <Text style={{ ...typography.bodySmall, color: themeColors.textSecondary }}>{upiConfig.vpa}</Text>
                                </View>
                            ) : (
                                <Text style={{ color: themeColors.textSecondary, textAlign: 'center' }}>No payment settings configured.</Text>
                            )}

                            {/* Reference input & Confirm button */}
                            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                                <Text style={[styles.detailLabel, { color: themeColors.textSecondary }]}>
                                    Transaction Reference (optional)
                                </Text>
                                <TextInput
                                    style={{
                                        borderWidth: 1,
                                        borderColor: borderColor,
                                        borderRadius: 8,
                                        padding: 12,
                                        color: themeColors.text,
                                        backgroundColor: inputBg,
                                        fontSize: 14,
                                    }}
                                    placeholder="Enter transaction ref / UTR"
                                    placeholderTextColor={themeColors.textSecondary}
                                    value={transactionRef}
                                    onChangeText={setTransactionRef}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={[styles.payButton, { backgroundColor: '#6739B7' }]}
                                    onPress={() => handleUpiConfirm(transactionRef)}
                                >
                                    <Text style={styles.payButtonText}>Payment Received</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </>
    );
}

// ── UPI QR Code HTML builder ─────────────────────────────────────────────────
function buildUpiQrHtml(opts: {
    vpa: string;
    name: string;
    amount: number;
    invoiceNumber: string;
    isDark: boolean;
}) {
    const upiUri = `upi://pay?pa=${encodeURIComponent(opts.vpa)}&pn=${encodeURIComponent(opts.name)}&am=${opts.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(opts.invoiceNumber)}`;
    const bg = opts.isDark ? '#1A1D27' : '#F8F9FB';
    const cardBg = opts.isDark ? '#252836' : '#FFFFFF';
    const textColor = opts.isDark ? '#F0F1F3' : '#1E293B';
    const subColor = opts.isDark ? '#9CA3AF' : '#64748B';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, system-ui, sans-serif; background: ${bg}; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }
    .card { background: ${cardBg}; border-radius: 16px; padding: 24px; width: 100%; max-width: 360px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .title { font-size: 18px; font-weight: 700; color: ${textColor}; margin-bottom: 4px; }
    .subtitle { font-size: 14px; color: ${subColor}; margin-bottom: 20px; }
    .amount { font-size: 32px; font-weight: 800; color: #6739B7; margin-bottom: 20px; }
    .qr-container { background: #FFFFFF; border-radius: 12px; padding: 16px; display: inline-block; margin-bottom: 16px; }
    .qr-container img { display: block; width: 200px; height: 200px; }
    .vpa { font-size: 13px; color: ${subColor}; margin-bottom: 24px; word-break: break-all; }
    .vpa strong { color: ${textColor}; }
    .instructions { font-size: 13px; color: ${subColor}; line-height: 1.6; margin-bottom: 24px; text-align: left; }
    .instructions ol { padding-left: 20px; }
    .confirm-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; background: #6739B7; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; }
    .confirm-btn:active { opacity: 0.85; }
    .ref-input { width: 100%; padding: 12px; border: 1.5px solid ${opts.isDark ? '#3D4155' : '#E2E8F0'}; border-radius: 8px; font-size: 14px; margin-bottom: 12px; background: ${bg}; color: ${textColor}; }
    .apps { display: flex; justify-content: center; gap: 16px; margin-bottom: 20px; }
    .app-badge { font-size: 11px; color: ${subColor}; background: ${bg}; padding: 6px 12px; border-radius: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Scan to Pay</div>
    <div class="subtitle">${opts.invoiceNumber}</div>
    <div class="amount">&#8377;${opts.amount.toFixed(2)}</div>
    <div class="qr-container">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}" alt="UPI QR Code" />
    </div>
    <div class="apps">
      <span class="app-badge">Google Pay</span>
      <span class="app-badge">PhonePe</span>
      <span class="app-badge">Paytm</span>
    </div>
    <div class="vpa">UPI ID: <strong>${opts.vpa}</strong></div>
    <div class="instructions">
      <ol>
        <li>Open any UPI app on the customer's phone</li>
        <li>Scan the QR code above</li>
        <li>Complete the payment</li>
        <li>Enter the transaction reference below and confirm</li>
      </ol>
    </div>
    <input class="ref-input" id="refInput" placeholder="Transaction reference (optional)" />
    <button class="confirm-btn" onclick="confirmPayment()">Payment Received</button>
  </div>
  <script>
    function confirmPayment() {
      var ref = document.getElementById('refInput').value || '';
      window.ReactNativeWebView.postMessage(JSON.stringify({
        event: 'upi.confirmed',
        transactionRef: ref
      }));
    }
  </script>
</body>
</html>`;
}

// ── Razorpay Checkout HTML builder ──────────────────────────────────────────
function buildRazorpayCheckoutHtml(opts: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    invoiceNumber: string;
}) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; font-family: -apple-system, sans-serif; }
    .loading { text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="loading"><p>Opening payment...</p></div>
  <script>
    var options = {
      key: "${opts.keyId}",
      amount: ${opts.amount},
      currency: "${opts.currency}",
      name: "FieldForce Pro",
      description: "${opts.invoiceNumber}",
      order_id: "${opts.orderId}",
      handler: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          event: "payment.success",
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        }));
      },
      modal: {
        ondismiss: function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ event: "payment.dismiss" }));
        },
        escape: false
      },
      theme: { color: "#2563EB" }
    };
    var rzp = new Razorpay(options);
    rzp.on("payment.failed", function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        event: "payment.failed",
        description: response.error ? response.error.description : "Payment failed. Please try again."
      }));
    });
    rzp.open();
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    content: {
        padding: spacing.lg,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        marginBottom: spacing.lg,
    },
    loadingText: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },

    // ── Main payment screen
    title: {
        ...typography.h2,
        marginBottom: spacing.xl,
    },
    invoiceCard: {
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    invoiceNumber: {
        ...typography.label,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    detailLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    detailValue: {
        ...typography.body,
        color: colors.text,
    },
    totalDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    totalLabel: {
        ...typography.body,
        color: colors.text,
        fontWeight: '600',
    },
    totalValue: {
        ...typography.body,
        color: colors.text,
        fontWeight: '600',
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    balanceLabel: {
        ...typography.h4,
        color: ACCENT,
    },
    balanceValue: {
        ...typography.h3,
        color: ACCENT,
    },
    paymentOptions: {
        gap: spacing.md,
    },
    payButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ACCENT,
        paddingVertical: spacing.lg,
        borderRadius: 10,
        gap: spacing.md,
        height: 52,
    },
    payButtonText: {
        ...typography.button,
        color: colors.textInverse,
    },
    payButtonDisabled: {
        backgroundColor: colors.border,
    },
    razorpayNote: {
        ...typography.caption,
        color: colors.warning,
        textAlign: 'center',
        marginTop: -spacing.xs,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginVertical: spacing.xs,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        ...typography.label,
        color: colors.textSecondary,
    },
    upiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    upiButtonText: {
        ...typography.button,
    },
    cashButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.success + '15',
        paddingVertical: spacing.lg,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.success + '40',
    },
    cashButtonText: {
        ...typography.button,
        color: colors.success,
    },
    statusBox: {
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
        borderRadius: borderRadius.lg,
        minHeight: 160,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    errorText: {
        ...typography.body,
        color: colors.error,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    retryButton: {
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderWidth: 1,
        borderColor: ACCENT,
        borderRadius: 10,
    },
    retryButtonText: {
        ...typography.button,
        color: ACCENT,
    },

    // ── Success state
    successTitle: {
        ...typography.h2,
        color: colors.success,
        marginTop: spacing.xl,
    },
    successSubtitle: {
        ...typography.body,
        color: colors.textSecondary,
        marginTop: spacing.sm,
        marginBottom: spacing['2xl'],
    },
    doneButton: {
        backgroundColor: ACCENT,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing['3xl'],
        borderRadius: 10,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButtonText: {
        ...typography.button,
        color: colors.textInverse,
    },

    // ── WebView modal
    webviewContainer: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    webviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFF',
    },
    webviewTitle: {
        ...typography.h4,
        color: colors.text,
    },
});
