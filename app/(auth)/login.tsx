import { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createClient } from '@/lib/supabase/client';
import { api } from '@/lib/api-client';
import { colors, fonts } from '@/theme/tokens';

function Field({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType = 'default',
    autoCapitalize = 'none',
    autoComplete,
    returnKeyType = 'next',
    onSubmitEditing,
    inputRef,
}: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: 'email-address' | 'default';
    autoCapitalize?: 'none' | 'sentences';
    autoComplete?: 'email' | 'password';
    returnKeyType?: 'next' | 'done' | 'go';
    onSubmitEditing?: () => void;
    inputRef?: React.RefObject<TextInputType | null>;
}) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.text.muted40}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                autoComplete={autoComplete}
                returnKeyType={returnKeyType}
                onSubmitEditing={onSubmitEditing}
                style={styles.input}
                selectionColor={colors.semantic.primary}
            />
        </View>
    );
}

export default function LoginScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const passwordRef = useRef<TextInputType | null>(null);

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            const supabase = createClient();
            const { error: authError } =
                await supabase.auth.signInWithPassword({ email, password });
            if (authError) {
                setError(authError.message || 'Email ou senha incorretos.');
                return;
            }
            try {
                const user = await api.get<{ onboardingDone: boolean }>('/api/user/me');
                router.replace(user.onboardingDone ? '/(tabs)' : '/onboarding');
            } catch {
                router.replace('/onboarding');
            }
        } catch {
            setError('Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.screen}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboard}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={[styles.hero, { paddingTop: insets.top + 48 }]}>
                        <Text style={styles.emoji}>🌱</Text>
                        <Text style={styles.title}>broto</Text>
                        <Text style={styles.tagline}>ESTUDE & FLORESCA</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.formTitle}>Entrar</Text>
                        <Text style={styles.formSubtitle}>Bem-vindo de volta</Text>

                        <View style={styles.fields}>
                            <Field
                                label="EMAIL"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="seu@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />
                            <Field
                                label="SENHA"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Digite sua senha"
                                secureTextEntry
                                autoComplete="password"
                                returnKeyType="go"
                                onSubmitEditing={handleSubmit}
                                inputRef={passwordRef}
                            />
                        </View>

                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <Pressable
                            onPress={handleSubmit}
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.submitBtn,
                                pressed && styles.submitPressed,
                                loading && styles.submitDisabled,
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitText}>Entrar</Text>
                            )}
                        </Pressable>

                        <View style={styles.linkRow}>
                            <Text style={styles.linkLabel}>Ainda não tem conta? </Text>
                            <Link href="/(auth)/signup">
                                <Text style={styles.linkAction}>Criar conta</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.bg.void,
    },
    keyboard: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    hero: {
        alignItems: 'center',
        paddingBottom: 32,
    },
    emoji: { fontSize: 48, marginBottom: 8 },
    title: {
        fontSize: 28,
        fontFamily: fonts.sansSemiBold,
        color: colors.text.primary,
        marginBottom: 4,
    },
    tagline: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.text.muted,
        letterSpacing: 2,
    },
    card: {
        backgroundColor: colors.bg.card,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    formTitle: {
        fontSize: 22,
        fontFamily: fonts.sansBold,
        color: colors.text.primary,
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.text.muted,
        marginBottom: 20,
    },
    fields: { gap: 16, marginBottom: 20 },
    field: { marginBottom: 12 },
    label: {
        fontSize: 12,
        fontFamily: fonts.sansSemiBold,
        color: colors.text.muted,
        marginBottom: 6,
    },
    input: {
        backgroundColor: colors.bg.void,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: fonts.sans,
        color: colors.text.primary,
    },
    errorBox: {
        backgroundColor: colors.red.glow,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    errorText: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.red[400],
    },
    submitBtn: {
        backgroundColor: colors.semantic.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitPressed: { opacity: 0.9 },
    submitDisabled: { opacity: 0.6 },
    submitText: {
        fontSize: 16,
        fontFamily: fonts.sansSemiBold,
        color: colors.semantic.primaryForeground,
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        gap: 4,
    },
    linkLabel: { fontSize: 14, fontFamily: fonts.sans, color: colors.text.muted },
    linkAction: {
        fontSize: 14,
        fontFamily: fonts.sansSemiBold,
        color: colors.semantic.primary,
    },
});
