import React, { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Phone, Plus, Trash2, User } from 'lucide-react-native';
import { Colors, Radius, Spacing, Typography } from '../constants/theme';
import { EmergencyContact } from '../types';
import { validatePhone } from '../lib/validators';
import { GhostButton, Panel, TextField } from './AppKit';
import * as Haptics from 'expo-haptics';

interface ContactListProps {
  contacts: EmergencyContact[];
  onAddContact: (name: string, phone: string) => void;
  onRemoveContact: (id: string) => void;
}

export default function ContactList({ contacts, onAddContact, onRemoveContact }: ContactListProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  function addContact() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Add a contact name before saving.');
      return;
    }
    const result = validatePhone(phone);
    if (!result.valid) {
      setPhoneError(result.error ?? 'Invalid phone number');
      return;
    }
    onAddContact(name.trim(), phone.trim());
    setName('');
    setPhone('');
    setPhoneError('');
  }

  function updatePhone(value: string) {
    setPhone(value);
    if (!value.trim()) {
      setPhoneError('');
      return;
    }
    const result = validatePhone(value);
    setPhoneError(result.valid ? '' : result.error ?? 'Invalid phone number');
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      {contacts.map((contact) => (
        <Panel key={contact.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: `${Colors.safeGreen}18`,
              borderWidth: 1,
              borderColor: `${Colors.safeGreen}32`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: Colors.safeGreen, fontSize: 16, lineHeight: 20, fontWeight: '900' }}>
              {contact.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: Colors.textPrimary, ...Typography.bodySmall, fontWeight: '800' }} numberOfLines={1}>
              {contact.name}
            </Text>
            <Text style={{ color: Colors.textMuted, ...Typography.caption }} numberOfLines={1}>
              {contact.phone}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Call ${contact.name}`}
            onPress={() => {
              Haptics.selectionAsync();
              Linking.openURL(`tel:${contact.phone}`);
            }}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? `${Colors.safeGreen}20` : Colors.surface2,
            })}
          >
            <Phone size={18} color={Colors.safeGreen} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${contact.name}`}
            onPress={() => onRemoveContact(contact.id)}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? `${Colors.sosRed}18` : Colors.surface2,
            })}
          >
            <Trash2 size={18} color={Colors.textFaint} />
          </Pressable>
        </Panel>
      ))}

      {contacts.length < 3 ? (
        <Panel style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <User size={16} color={Colors.textMuted} />
            <Text style={{ color: Colors.textMuted, ...Typography.label }}>ADD CONTACT</Text>
          </View>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Family member or friend" returnKeyType="next" />
          <TextField
            label="Phone"
            value={phone}
            onChangeText={updatePhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            error={phoneError}
            returnKeyType="done"
            onSubmitEditing={addContact}
          />
          <GhostButton label={`Add contact (${contacts.length}/3)`} tone="green" Icon={Plus} onPress={addContact} />
        </Panel>
      ) : null}
    </View>
  );
}
