import { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router, useNavigation } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";
import DecorativeBackground from "../../component/DecorativeBackground";
import { colors, fonts, shadows } from "../theme";
import { changePassword } from "../../api/auth";

export default function Settings() {
  const navigation = useNavigation();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: "Settings",
    });
  }, [navigation]);

  const openChangePassword = () => {
    setChangePasswordOpen(true);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordError("");
    setChangePasswordSuccess("");
  };

  const closeChangePassword = () => {
    setChangePasswordOpen(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordError("");
    setChangePasswordSuccess("");
  };

  const submitChangePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setChangePasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError("New password must be at least 6 characters.");
      return;
    }

    if (oldPassword === newPassword) {
      setChangePasswordError("New password cannot be the same as old password.");
      return;
    }

    setIsChangingPassword(true);
    setChangePasswordError("");

    try {
      await changePassword(oldPassword, newPassword);
      setChangePasswordSuccess("Password changed successfully!");
      setTimeout(() => {
        closeChangePassword();
      }, 1500);
    } catch (error) {
      setChangePasswordError(error?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePrivacy = () => {
    Alert.alert(
      "Privacy Policy",
      "This feature will be available soon.",
      [{ text: "OK" }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      "Help & Support",
      "This feature will be available soon.",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBackground variant="light">
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <Pressable style={styles.buttonItem} onPress={openChangePassword}>
              <View style={styles.buttonContent}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.onyx} />
                <View style={styles.buttonText}>
                  <Text style={styles.buttonLabel}>Change Password</Text>
                  <Text style={styles.buttonDescription}>
                    Update your account password
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <Pressable style={styles.buttonItem} onPress={handleHelp}>
              <View style={styles.buttonContent}>
                <Ionicons name="help-circle-outline" size={20} color={colors.onyx} />
                <View style={styles.buttonText}>
                  <Text style={styles.buttonLabel}>Help & Support</Text>
                  <Text style={styles.buttonDescription}>
                    Get help with your account
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.buttonItem} onPress={handlePrivacy}>
              <View style={styles.buttonContent}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.onyx} />
                <View style={styles.buttonText}>
                  <Text style={styles.buttonLabel}>Privacy Policy</Text>
                  <Text style={styles.buttonDescription}>
                    Review our privacy practices
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </View>

          {/* App Version */}
          <View style={styles.section}>
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>App Version</Text>
                <Text style={styles.settingDescription}>1.0.0</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </DecorativeBackground>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordOpen}
        transparent
        animationType="slide"
        onRequestClose={closeChangePassword}
      >
        <View style={styles.modalBackdrop}>
          <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Pressable onPress={closeChangePassword} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {changePasswordSuccess ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.violet} />
                  <Text style={styles.successMessage}>{changePasswordSuccess}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.modalLabel}>Current Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      placeholder="Enter your current password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!showOldPassword}
                      editable={!isChangingPassword}
                      style={styles.modalInput}
                    />
                    <Pressable
                      onPress={() => setShowOldPassword(!showOldPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showOldPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={colors.muted}
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.modalLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter your new password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!showNewPassword}
                      editable={!isChangingPassword}
                      style={styles.modalInput}
                    />
                    <Pressable
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={colors.muted}
                      />
                    </Pressable>
                  </View>

                  <Text style={styles.modalLabel}>Confirm New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your new password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isChangingPassword}
                      style={styles.modalInput}
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={colors.muted}
                      />
                    </Pressable>
                  </View>

                  {changePasswordError ? (
                    <Text style={styles.errorText}>{changePasswordError}</Text>
                  ) : null}

                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.secondaryButton}
                      onPress={closeChangePassword}
                      disabled={isChangingPassword}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.payButton, isChangingPassword && styles.buttonDisabled]}
                      onPress={submitChangePassword}
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? (
                        <ActivityIndicator size="small" color={colors.onyx} />
                      ) : (
                        <Text style={styles.payButtonText}>Change Password</Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.whiteSmoke,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    overflow: "hidden",
    ...shadows.lift,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    fontFamily: fonts.body,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onyx,
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: fonts.body,
  },
  divider: {
    height: 1,
    backgroundColor: colors.softOnyx,
  },
  buttonItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonText: {
    flex: 1,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.onyx,
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  buttonDescription: {
    fontSize: 13,
    color: colors.muted,
    fontFamily: fonts.body,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 17, 8, 0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    overflow: "hidden",
    ...shadows.lift,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.softOnyx,
    backgroundColor: colors.whiteSmoke,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  modalClose: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modalCloseText: {
    color: colors.muted,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    fontFamily: fonts.body,
    marginBottom: 8,
    marginTop: 12,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.softViolet,
    borderRadius: 12,
    backgroundColor: colors.whiteSmoke,
    paddingRight: 12,
    marginBottom: 4,
  },
  modalInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.onyx,
    fontFamily: fonts.body,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: colors.coral,
    fontSize: 13,
    fontFamily: fonts.body,
    marginTop: 10,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  successMessage: {
    color: colors.violet,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.body,
    marginTop: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 20,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    backgroundColor: colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: colors.muted,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  payButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.coral,
    paddingVertical: 10,
    alignItems: "center",
  },
  payButtonText: {
    color: colors.onyx,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: fonts.body,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
