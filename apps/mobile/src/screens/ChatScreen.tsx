import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatMsg, getChat, sendChat } from "../api";
import { colors } from "../theme";

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getChat()
      .then((data) => setMessages(data.messages))
      .catch(() => {});
  }, []);

  async function onSend() {
    const message = input.trim();
    if (!message || sending) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setSending(true);
    try {
      const data = await sendChat(message);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "No se pudo obtener respuesta.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Pregúntame lo que quieras: técnica, cambios de ejercicios, nutrición básica…
          </Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.bubbleText}>{item.content}</Text>
          </View>
        )}
      />
      {sending && (
        <View style={styles.typing}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.muted, fontSize: 12 }}>Tu entrenador está escribiendo…</Text>
        </View>
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu pregunta…"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          editable={!sending}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={onSend} disabled={sending}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40, paddingHorizontal: 20 },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 10, maxWidth: "85%" },
  userBubble: { backgroundColor: colors.primaryDark, alignSelf: "flex-end" },
  aiBubble: { backgroundColor: colors.card, alignSelf: "flex-start" },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  typing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
});
