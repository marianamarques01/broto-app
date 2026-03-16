import { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
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
    maxLength,
}: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: 'email-address' | 'default' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoComplete?: 'email' | 'password' | 'new-password' | 'name';
    returnKeyType?: 'next' | 'done' | 'go';
    onSubmitEditing?: () => void;
    inputRef?: React.RefObject<TextInputType | null>;
    maxLength?: number;
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
                maxLength={maxLength}
                style={styles.input}
                selectionColor={colors.semantic.primary}
            />
        </View>
    );
}

export default function SignupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [form, setForm] = useState({
        nome: '',
        email: '',
        password: '',
        telefone: '',
        cpf: '',
        cidade: '',
        estado: '',
    });
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showOptional, setShowOptional] = useState(false);

    const emailRef = useRef<TextInputType | null>(null);
    const passwordRef = useRef<TextInputType | null>(null);

    function updateForm(key: string, value: string) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    async function pickAvatar() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    }

    async function uploadAvatar(userId: string): Promise<string | undefined> {
        if (!avatarUri) return undefined;
        const supabase = createClient();
        const ext = avatarUri.split('.').pop() ?? 'jpg';
        const path = `${userId}/avatar.${ext}`;
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        const { error } = await supabase.storage
            .from('avatars')
            .upload(path, blob, { upsert: true, contentType: `image/${ext}` });
        if (error) return undefined;
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        return data.publicUrl;
    }

    async function handleSubmit() {
        setError(null);
        setLoading(true);
        try {
            const result = await api.post<{ userId: string }>('/api/auth/signup', form);
            const supabase = createClient();
            const { error: loginError } =
                await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.password,
                });
            if (loginError) {
                router.replace('/(auth)/login');
                return;
            }
            if (avatarUri) {
                try {
                    const imageUrl = await uploadAvatar(result.userId);
                    if (imageUrl) await api.patch('/api/user/profile', { imageUrl });
                } catch {}
            }
            router.replace('/onboarding');
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.',
            );
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
                    <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
                        <Link href="/(auth)/login">
                            <Text style={styles.backLink}>← Voltar</Text>
                        </Link>
                        <Text style={styles.emoji}>🌱</Text>
                        <Text style={styles.title}>Criar conta</Text>
                        <Text style={styles.subtitle}>Comece sua jornada com o Broto</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.avatarSection}>
                            <Pressable onPress={pickAvatar} style={styles.avatarBtn}>
                                {avatarUri ? (
                                    <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={styles.avatarPlaceholder}>📷</Text>
                                )}
                            </Pressable>
                            <Text style={styles.avatarLabel}>Foto (opcional)</Text>
                        </View>

                        <View style={styles.fields}>
                            <Field
                                label="NOME COMPLETO *"
                                value={form.nome}
                                onChangeText={v => updateForm('nome', v)}
                                placeholder="Seu nome completo"
                                autoCapitalize="words"
                                autoComplete="name"
                                returnKeyType="next"
                                onSubmitEditing={() => emailRef.current?.focus()}
                            />
                            <Field
                                label="EMAIL *"
                                value={form.email}
                                onChangeText={v => updateForm('email', v)}
                                placeholder="seu@email.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                returnKeyType="next"
                                inputRef={emailRef}
                                onSubmitEditing={() => passwordRef.current?.focus()}
                            />
                            <Field
                                label="SENHA *"
                                value={form.password}
                                onChangeText={v => updateForm('password', v)}
                                placeholder="Mínimo 6 caracteres"
                                secureTextEntry
                                autoComplete="new-password"
                                returnKeyType="done"
                                inputRef={passwordRef}
                            />
                        </View>

                        <Pressable
                            onPress={() => setShowOptional(v => !v)}
                            style={styles.optionalToggle}
                        >
                            <Text style={styles.optionalToggleText}>
                                {showOptional ? '▼' : '▶'} Informações opcionais
                            </Text>
                        </Pressable>

                        {showOptional && (
                            <View style={styles.optionalGrid}>
                                <Field
                                    label="CPF"
                                    value={form.cpf}
                                    onChangeText={v => updateForm('cpf', v)}
                                    placeholder="000.000.000-00"
                                />
                                <Field
                                    label="Celular"
                                    value={form.telefone}
                                    onChangeText={v => updateForm('telefone', v)}
                                    placeholder="(11) 99999-9999"
                                    keyboardType="phone-pad"
                                />
                                <Field
                                    label="Cidade"
                                    value={form.cidade}
                                    onChangeText={v => updateForm('cidade', v)}
                                    placeholder="São Paulo"
                                />
                                <Field
                                    label="Estado"
                                    value={form.estado}
                                    onChangeText={v => updateForm('estado', v)}
                                    placeholder="SP"
                                    maxLength={2}
                                    autoCapitalize="characters"
                                />
                            </View>
                        )}

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
                                <Text style={styles.submitText}>Criar conta</Text>
                            )}
                        </Pressable>

                        <View style={styles.linkRow}>
                            <Text style={styles.linkLabel}>Já tem conta? </Text>
                            <Link href="/(auth)/login">
                                <Text style={styles.linkAction}>Entrar</Text>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg.void },
    keyboard: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
    hero: { alignItems: 'center', paddingBottom: 24 },
    backLink: {
        alignSelf: 'flex-start',
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.text.secondary,
        marginBottom: 16,
    },
    emoji: { fontSize: 40, marginBottom: 8 },
    title: {
        fontSize: 24,
        fontFamily: fonts.sansSemiBold,
        color: colors.text.primary,
        marginBottom: 4,
    },
    subtitle: { fontSize: 14, fontFamily: fonts.sans, color: colors.text.muted },
    card: {
        backgroundColor: colors.bg.card,
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    avatarSection: { alignItems: 'center', marginBottom: 20 },
    avatarBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.bg.elevated,
        borderWidth: 1,
        borderColor: colors.border.default,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarPlaceholder: { fontSize: 32, fontFamily: fonts.sans },
    avatarLabel: { fontSize: 12, fontFamily: fonts.sans, color: colors.text.muted, marginTop: 8 },
    fields: { gap: 4, marginBottom: 16 },
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
    optionalToggle: { marginBottom: 12 },
    optionalToggleText: { fontSize: 14, fontFamily: fonts.sans, color: colors.text.secondary },
    optionalGrid: { gap: 4, marginBottom: 20 },
    errorBox: {
        backgroundColor: colors.red.glow,
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
    },
    errorText: { fontSize: 14, fontFamily: fonts.sans, color: colors.red[400] },
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
    linkAction: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.semantic.primary },
});
