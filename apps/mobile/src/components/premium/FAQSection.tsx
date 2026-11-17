import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import type { PremiumFaqItem } from '@/types/subscription';

const DEFAULT_FAQS: PremiumFaqItem[] = [
    {
        id: 'f1',
        question: "Premium'u nasıl iptal edebilirim?",
        answer:
            "Ayarlar > Abonelik Yönetimi'nden istediğiniz zaman iptal edebilirsiniz. Mevcut dönem sonuna kadar erişiminiz sürer.",
        isActive: true,
    },
    {
        id: 'f2',
        question: 'Farklı cihazlarda kullanabilir miyim?',
        answer:
            'Evet, aynı hesapla giriş yaptığınız tüm cihazlarda premium özellikleriniz otomatik aktif olur.',
        isActive: true,
    },
    {
        id: 'f3',
        question: 'Deneme süresi var mı?',
        answer:
            'İlk kez abone olan kullanıcılar 7 günlük ücretsiz deneme süresi boyunca tüm özellikleri deneyimleyebilir.',
        isActive: true,
    },
    {
        id: 'f4',
        question: 'Aylık ve yıllık plan arasındaki fark nedir?',
        answer:
            'Her iki plan da tüm premium özellikleri içerir. Yıllık plan ile %17 tasarruf sağlarsınız.',
        isActive: true,
    },
    {
        id: 'f5',
        question: 'Ödeme güvenli mi?',
        answer:
            'Tüm ödemeler Apple App Store veya Google Play Store altyapısı üzerinden güvenle işlenir.',
        isActive: true,
    },
];

export function FAQSection({ faqs }: { faqs?: PremiumFaqItem[] }) {
    const router = useRouter();
    const theme = useTheme();
    const styles = createStyles(theme);
    const activeFaqs = (faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS).filter(
        (f) => f.isActive !== false,
    );

    return (
        <View style={styles.container}>
            {activeFaqs.length > 0 && (
                <>
                    <Text style={styles.title}>Sıkça Sorulan Sorular</Text>
                    <View style={styles.faqList}>
                        {activeFaqs.map((faq) => (
                            <FAQItem key={faq.id || faq.question} faq={faq} />
                        ))}
                    </View>
                </>
            )}

            <View style={styles.linksContainer}>
                <TouchableOpacity onPress={() => router.push('/settings/terms-of-service' as any)}>
                    <Text style={styles.linkText}>Kullanım Koşulları</Text>
                </TouchableOpacity>
                <Text style={styles.separator}>•</Text>
                <TouchableOpacity onPress={() => router.push('/settings/privacy-policy' as any)}>
                    <Text style={styles.linkText}>Gizlilik Politikası</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function FAQItem({ faq }: { faq: { question: string; answer: string } }) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <TouchableOpacity
            style={styles.faqItem}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.75}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.question}>{faq.question}</Text>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.colors.textSecondary}
                />
            </View>
            {isExpanded && <Text style={styles.answer}>{faq.answer}</Text>}
        </TouchableOpacity>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {},
        title: {
            fontSize: 16.5,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 12,
        },
        faqList: {
            gap: 8,
            marginBottom: 16,
        },
        faqItem: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        faqHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
        },
        question: {
            fontSize: 14,
            color: theme.colors.text,
            fontWeight: '600',
            flex: 1,
        },
        answer: {
            fontSize: 13,
            color: theme.colors.textSecondary,
            marginTop: 8,
            lineHeight: 19,
        },
        linksContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 8,
        },
        linkText: {
            fontSize: 13,
            color: theme.colors.primary,
            fontWeight: '600',
        },
        separator: {
            fontSize: 13,
            color: theme.colors.textLight,
        },
    });
