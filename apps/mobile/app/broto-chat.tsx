import { useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  BackHandler,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, Send } from 'lucide-react-native'
import { api, ApiError } from '@/lib/api-client'
import { colors, fonts } from '@/theme/tokens'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  role: 'assistant',
  content: 'Oi! Sou o Broto, seu assistente de estudos. Como posso te ajudar?',
}

const COMPOSER_MIN_H = 48
const SEND_SIZE = 48

export default function BrotoChatScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  /**
   * Modal no root Stack: `back()` pode não fechar. `dismissTo('/(tabs)')` volta às abas sem usar
   * `canGoBack`/`canDismiss` (no DOM eles lançam e quebram o botão).
   */
  const leaveChat = useCallback(() => {
    router.dismissTo('/(tabs)')
  }, [router])

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        leaveChat()
        return true
      })
      return () => sub.remove()
    }, [leaveChat]),
  )

  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)
  let nextId = useRef(1)

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: String(nextId.current++), role: 'user', content: text }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const resp = await api.post<{ message: string }>('/api/broto/chat', {
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      })
      setMessages((prev) => [
        ...prev,
        { id: String(nextId.current++), role: 'assistant', content: resp.message },
      ])
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : ''
      setMessages((prev) => [
        ...prev,
        {
          id: String(nextId.current++),
          role: 'assistant',
          content: detail || 'Desculpe, tive um problema. Tente novamente.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === 'user'
    return (
      <View
        style={{
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '80%',
          marginHorizontal: 16,
          marginVertical: 4,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 18,
          borderBottomRightRadius: isUser ? 4 : 18,
          borderBottomLeftRadius: isUser ? 18 : 4,
          backgroundColor: isUser ? colors.green[600] : colors.bg.card,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border.subtle,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            fontFamily: fonts.sans,
            color: isUser ? '#fff' : colors.text.primary,
          }}
        >
          {item.content}
        </Text>
      </View>
    )
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.deep }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#031A11',
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <Pressable
          onPress={leaveChat}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
            paddingVertical: 8,
            paddingRight: 8,
            marginVertical: -8,
            marginLeft: -8,
          })}
        >
          <ArrowLeft size={22} color={colors.text.secondary} />
        </Pressable>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.bg.deep,
            borderWidth: 1.5,
            borderColor: colors.green[600],
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 12,
          }}
        >
          <Text style={{ fontSize: 16 }}>{'\u{1F331}'}</Text>
        </View>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: fonts.sansBold,
              color: colors.text.primary,
            }}
          >
            Broto AI
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: fonts.sans,
              color: colors.text.muted,
            }}
          >
            Assistente de estudos
          </Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginHorizontal: 16,
                  marginVertical: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 18,
                  borderBottomLeftRadius: 4,
                  backgroundColor: colors.bg.card,
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ActivityIndicator size="small" color={colors.green[500]} />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.sans,
                    color: colors.text.muted,
                  }}
                >
                  Pensando...
                </Text>
              </View>
            ) : null
          }
        />

        {/* Input — botão centralizado na altura do campo (inclui multilinha) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: '#031A11',
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
            gap: 10,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Pergunte algo ao Broto..."
            placeholderTextColor={colors.text.secondary}
            editable={!loading}
            multiline
            maxLength={2000}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            textAlignVertical={Platform.OS === 'android' ? 'top' : undefined}
            style={{
              flex: 1,
              minHeight: COMPOSER_MIN_H,
              maxHeight: 120,
              paddingHorizontal: 16,
              paddingTop: Platform.OS === 'ios' ? 12 : 10,
              paddingBottom: Platform.OS === 'ios' ? 12 : 10,
              borderRadius: COMPOSER_MIN_H / 2,
              backgroundColor: colors.bg.card,
              borderWidth: 1,
              borderColor: colors.border.strong,
              fontSize: 15,
              lineHeight: 20,
              fontFamily: fonts.sans,
              color: colors.text.primary,
              ...(Platform.OS === 'web'
                ? ({ outlineStyle: 'none', resize: 'none' } as object)
                : null),
            }}
          />
          <Pressable
            onPress={sendMessage}
            disabled={loading || !input.trim()}
            style={({ pressed }) => ({
              width: SEND_SIZE,
              height: SEND_SIZE,
              borderRadius: SEND_SIZE / 2,
              overflow: 'hidden',
              opacity: pressed ? 0.88 : 1,
              borderWidth: 1,
              borderColor: !input.trim() || loading ? colors.border.default : 'transparent',
            })}
          >
            {!input.trim() || loading ? (
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.bg.elevated,
                }}
              >
                <Send size={20} color={colors.text.secondary} />
              </View>
            ) : (
              <LinearGradient
                colors={[colors.cta.gradientStart, colors.cta.gradientEnd]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={20} color={colors.cta.text} />
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
