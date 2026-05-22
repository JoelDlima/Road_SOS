import React from 'react';
import { Text, View } from 'react-native';
import { Bot } from 'lucide-react-native';
import { ChatMessage } from '../types';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';

interface ChatBubbleProps {
  message: ChatMessage;
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      parts.push(<Text key={`t-${key++}`}>{text.slice(lastIndex, match.index)}</Text>);
    }

    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <Text key={`c-${key++}`} style={{ fontFamily: 'monospace', fontSize: 13, backgroundColor: Colors.surface2, borderRadius: 4 }}>
          {token.slice(1, -1)}
        </Text>,
      );
    } else if (token.startsWith('**')) {
      parts.push(
        <Text key={`b-${key++}`} style={{ fontWeight: '800' }}>
          {token.slice(2, -2)}
        </Text>,
      );
    } else {
      parts.push(
        <Text key={`i-${key++}`} style={{ fontStyle: 'italic' }}>
          {token.slice(1, -1)}
        </Text>,
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(<Text key={`t-${key++}`}>{text.slice(lastIndex)}</Text>);
  }

  return parts;
}

function renderMessage(text: string) {
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={`gap-${index}`} style={{ height: 7 }} />;

    const numbered = trimmed.match(/^(\d+)\.\s+(.*)$/);
    const bullet = trimmed.match(/^[-*]\s+(.*)$/);
    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);

    if (heading) {
      return (
        <Text key={index} style={{ color: Colors.textPrimary, fontSize: 16, lineHeight: 22, fontWeight: '800', marginTop: 4 }}>
          {renderInline(heading[2] ?? '')}
        </Text>
      );
    }

    if (numbered) {
      return (
        <Text key={index} style={{ color: Colors.textPrimary, fontSize: 15, lineHeight: 22 }}>
          <Text style={{ color: Colors.infoBlue, fontWeight: '800' }}>{numbered[1]}. </Text>
          {renderInline(numbered[2] ?? '')}
        </Text>
      );
    }

    if (bullet) {
      return (
        <Text key={index} style={{ color: Colors.textPrimary, fontSize: 15, lineHeight: 22 }}>
          <Text style={{ color: Colors.infoBlue, fontWeight: '800' }}>{'- '}</Text>
          {renderInline(bullet[1] ?? '')}
        </Text>
      );
    }

    return (
      <Text key={index} style={{ color: Colors.textPrimary, fontSize: 15, lineHeight: 22 }}>
        {renderInline(line)}
      </Text>
    );
  });
}

export const ChatBubble = React.memo(function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        paddingHorizontal: Spacing.lg,
        paddingVertical: 5,
      }}
    >
      {!isUser ? (
        <View
          accessible={false}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: `${Colors.infoBlue}18`,
            borderWidth: 1,
            borderColor: `${Colors.infoBlue}38`,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.sm,
            marginTop: 5,
          }}
        >
          <Bot size={15} color={Colors.infoBlue} />
        </View>
      ) : null}

      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={isUser ? 'Your message' : 'Assistant message'}
        style={{
          maxWidth: isUser ? '82%' : '78%',
          backgroundColor: isUser ? Colors.sosRed : Colors.surface,
          borderRadius: Radius.xl,
          borderTopRightRadius: isUser ? Radius.sm : Radius.xl,
          borderTopLeftRadius: isUser ? Radius.xl : Radius.sm,
          borderWidth: 1,
          borderColor: isUser ? Colors.sosRed : Colors.border,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
        }}
      >
        {isUser ? (
          <Text selectable style={{ color: '#FFFFFF', fontSize: 15, lineHeight: 22 }}>
            {message.content}
            {message.isStreaming ? <Text> |</Text> : null}
          </Text>
        ) : (
          <View>
            {renderMessage(message.content || (message.isStreaming ? 'Thinking...' : ''))}
            {message.isStreaming ? <Text style={{ color: Colors.infoBlue, ...Typography.bodySmall }}> |</Text> : null}
          </View>
        )}
        <Text style={{ color: isUser ? 'rgba(255,255,255,0.68)' : Colors.textFaint, fontSize: 10, lineHeight: 14, marginTop: 6 }}>
          {time}
        </Text>
      </View>
    </View>
  );
});
