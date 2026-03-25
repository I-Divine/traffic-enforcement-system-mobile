import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { findOwnerByPlate } from "../../../api/plateLookup";
import { createViolation, getViolationTypes } from "../../../api/violations";
import { colors, fonts, shadows } from "../../theme";

const PLATE_API_TOKEN = process.env.EXPO_PUBLIC_PLATE_RECOGNIZER_API_TOKEN;

const normalizePlate = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const pickValue = (data, keys, fallback = "N/A") => {
  for (const key of keys) {
    if (data?.[key] !== null && data?.[key] !== undefined && data?.[key] !== "") {
      return data[key];
    }
  }
  return fallback;
};

export default function TrafficOfficerPlateSearchTab() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState("back");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [photoUri, setPhotoUri] = useState("");
  const [detectedPlate, setDetectedPlate] = useState("");
  const [plateInput, setPlateInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [recognitionError, setRecognitionError] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [violationModalVisible, setViolationModalVisible] = useState(false);
  const [violationStep, setViolationStep] = useState(0);
  const [violationSubmitting, setViolationSubmitting] = useState(false);
  const [violationError, setViolationError] = useState("");
  const [violationSuccess, setViolationSuccess] = useState("");
  const [violationTypes, setViolationTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState("");
  const [typePickerVisible, setTypePickerVisible] = useState(false);
  const [violationForm, setViolationForm] = useState({
    plateNumber: "",
    violationDate: "",
    gpsCoordinates: "",
    fineAmount: "",
    violationType: "",
    description: "",
    state: "",
    lga: "",
  });

  const runLookup = async (candidatePlate) => {
    const normalized = normalizePlate(candidatePlate);
    if (!normalized) {
      setSearchError("Enter a valid plate number.");
      return;
    }

    setSearching(true);
    setSearchError("");
    setLookupResult(null);

    try {
      const data = await findOwnerByPlate(normalized);
      setLookupResult(data);
      setViolationSuccess("");
      setModalVisible(true);
    } catch (lookupError) {
      setSearchError(lookupError?.message || "Plate lookup failed.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setTypesLoading(true);
    setTypesError("");

    getViolationTypes()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setViolationTypes(list);
      })
      .catch((error) => {
        if (!isMounted) return;
        setTypesError(error?.message || "Unable to load violation types.");
      })
      .finally(() => {
        if (isMounted) setTypesLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const recognizePlateFromImage = async (uri) => {
    if (!PLATE_API_TOKEN) {
      setRecognitionError("Plate recognition token is missing in .env.");
      return;
    }

    setIsRecognizing(true);
    setRecognitionError("");

    try {
      const formData = new FormData();
      formData.append("upload", {
        uri,
        name: `plate-${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const response = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
        method: "POST",
        headers: {
          Authorization: `Token ${PLATE_API_TOKEN}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || `Recognition failed (${response.status}).`);
      }

      const bestPlate = normalizePlate(data?.results?.[0]?.plate || "");
      if (!bestPlate) {
        throw new Error("No plate was detected in the image.");
      }

      setDetectedPlate(bestPlate);
      setPlateInput(bestPlate);
      await runLookup(bestPlate);
    } catch (error) {
      setRecognitionError(error?.message || "Failed to extract plate.");
    } finally {
      setIsRecognizing(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing || isRecognizing) {
      return;
    }

    setIsCapturing(true);
    setRecognitionError("");

    try {
      const captured = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });
      setPhotoUri(captured?.uri || "");
      await recognizePlateFromImage(captured?.uri || "");
    } catch (captureError) {
      setRecognitionError(captureError?.message || "Failed to capture image.");
    } finally {
      setIsCapturing(false);
    }
  };

  const clearCameraState = () => {
    setPhotoUri("");
    setDetectedPlate("");
    setRecognitionError("");
    setIsCameraReady(false);
  };

  const buildViolationForm = (plateValue) => ({
    plateNumber: normalizePlate(plateValue),
    violationDate: new Date().toISOString().slice(0, 19),
    gpsCoordinates: "",
    fineAmount: "",
    violationType: "",
    description: "",
    state: "",
    lga: "",
  });

  const setViolationField = (field, value) => {
    setViolationForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectViolationType = (item) => {
    if (!item) return;
    setViolationField("violationType", item.type);
    setViolationField("fineAmount", String(item.fineAmount ?? ""));
    setTypePickerVisible(false);
  };

  const normalizeViolationDate = (value) => {
    if (!value) return value;
    if (value.includes("T")) return value;
    if (value.includes(" ")) return value.replace(" ", "T");
    return value;
  };

  const ownerData = lookupResult || {};
  const ownerName =
    `${pickValue(ownerData, ["firstName"], "")} ${pickValue(ownerData, ["lastName"], "")}`.trim() ||
    pickValue(ownerData, ["fullName", "name"]);
  const ownerEmail = pickValue(ownerData, ["email"]);
  const ownerPhone = pickValue(ownerData, ["phoneNumber", "phone"]);
  const ownerRole = pickValue(ownerData, ["role"]);
  const licenseNo = pickValue(ownerData?.ownerDetails || ownerData, [
    "driversLicenseNumber",
    "licenseNumber",
  ]);
  const ownerAddress =
    [ownerData?.ownerDetails?.address, ownerData?.ownerDetails?.city, ownerData?.ownerDetails?.state]
      .filter(Boolean)
      .join(", ") || "N/A";

  const normalizedInputPlate = normalizePlate(plateInput || detectedPlate);
  const matchedVehicle = Array.isArray(ownerData?.vehicles)
    ? ownerData.vehicles.find((vehicle) => normalizePlate(vehicle?.plateNumber) === normalizedInputPlate) ||
      ownerData.vehicles[0]
    : null;

  const resolvedPlate = pickValue(
    matchedVehicle,
    ["plateNumber", "plate"],
    normalizedInputPlate || "N/A"
  );
  const vehicleMake = pickValue(matchedVehicle, ["make"]);
  const vehicleModel = pickValue(matchedVehicle, ["model"]);
  const vehicleColor = pickValue(matchedVehicle, ["color"]);
  const vehicleYear = pickValue(matchedVehicle, ["year"]);

  const violationSteps = [
    { key: "basic", title: "Violation Details" },
    { key: "location", title: "Location & Time" },
    { key: "fine", title: "Fine & Review" },
  ];

  const canContinueStep1 =
    Boolean(violationForm.violationType?.trim()) && Boolean(violationForm.description?.trim());
  const canContinueStep2 =
    Boolean(violationForm.violationDate?.trim()) &&
    Boolean(violationForm.state?.trim()) &&
    Boolean(violationForm.lga?.trim());
  const fineAmountValue = Number(violationForm.fineAmount);
  const canSubmit =
    Number.isFinite(fineAmountValue) &&
    fineAmountValue > 0 &&
    Boolean(violationForm.violationType?.trim());

  const submitViolation = async () => {
    if (!canSubmit || violationSubmitting) return;

    setViolationSubmitting(true);
    setViolationError("");

    try {
      const payload = {
        plateNumber: violationForm.plateNumber || resolvedPlate,
        violationDate: normalizeViolationDate(violationForm.violationDate),
        gpsCoordinates: violationForm.gpsCoordinates,
        fineAmount: fineAmountValue,
        violationType: violationForm.violationType,
        description: violationForm.description,
        state: violationForm.state,
        lga: violationForm.lga,
      };

      await createViolation(payload);
      setViolationSuccess("Violation recorded successfully.");
      setViolationModalVisible(false);
    } catch (error) {
      setViolationError(error?.message || "Failed to save violation.");
    } finally {
      setViolationSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.title}>Plate Lookup</Text>
        <Text style={styles.subtitle}>
          Search owner by capturing a license plate image or entering the plate number.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            value={plateInput}
            onChangeText={(value) => setPlateInput(normalizePlate(value))}
            placeholder="Enter plate number"
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor={colors.muted}
          />
          <Pressable
            onPress={() => runLookup(plateInput)}
            style={[styles.actionButton, searching && styles.actionButtonDisabled]}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator size="small" color={colors.onyx} />
            ) : (
              <Text style={styles.actionButtonText}>Search</Text>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cameraHeader}>
          <Text style={styles.title}>Camera Scan</Text>
          <Pressable
            onPress={() => {
              setIsCameraReady(false);
              setFacing((current) => (current === "back" ? "front" : "back"));
            }}
            style={styles.flipButton}
          >
            <Ionicons name="camera-reverse-outline" size={18} color={colors.violet} />
            <Text style={styles.flipText}>Flip</Text>
          </Pressable>
        </View>

        {!permission ? <Text style={styles.helperText}>Checking camera permission...</Text> : null}

        {permission && !permission.granted ? (
          <Pressable onPress={requestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </Pressable>
        ) : null}

        {permission?.granted ? (
          <>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.cameraFrame}>
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing={facing}
                  onCameraReady={() => setIsCameraReady(true)}
                />
              </View>
            )}

            <View style={styles.cameraActions}>
              {!photoUri ? (
                <Pressable
                  onPress={takePhoto}
                  style={[
                    styles.captureButton,
                    (!isCameraReady || isCapturing || isRecognizing) && styles.actionButtonDisabled,
                  ]}
                  disabled={!isCameraReady || isCapturing || isRecognizing}
                >
                  <Text style={styles.captureButtonText}>
                    {isCapturing ? "Capturing..." : isRecognizing ? "Analyzing..." : "Capture Plate"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={clearCameraState} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Retake Photo</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : null}

        {detectedPlate ? <Text style={styles.detectedText}>Detected Plate: {detectedPlate}</Text> : null}

        {recognitionError ? <Text style={styles.errorText}>{recognitionError}</Text> : null}
      </View>

      {searchError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{searchError}</Text>
        </View>
      ) : null}

      {violationSuccess ? (
        <View style={styles.successCard}>
          <Text style={styles.successText}>{violationSuccess}</Text>
        </View>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Owner Match Found</Text>
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.onyx} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Owner</Text>
                <Text style={styles.detailValue}>{ownerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{ownerRole}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{ownerPhone}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{ownerEmail}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{ownerAddress}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>License</Text>
                <Text style={styles.detailValue}>{licenseNo}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Plate</Text>
                <Text style={styles.detailValue}>{resolvedPlate}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>{`${vehicleMake} ${vehicleModel}`.trim()}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{vehicleColor}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Year</Text>
                <Text style={styles.detailValue}>{vehicleYear}</Text>
              </View>

              <Pressable
                style={styles.saveButton}
                onPress={() => {
                  setModalVisible(false);
                  setViolationForm(buildViolationForm(resolvedPlate));
                  setViolationStep(0);
                  setViolationError("");
                  setViolationModalVisible(true);
                }}
              >
                <Text style={styles.saveButtonText}>Continue to Violation</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={violationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setViolationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Violation</Text>
              <Pressable onPress={() => setViolationModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.onyx} />
              </Pressable>
            </View>

            <View style={styles.stepRow}>
              {violationSteps.map((step, index) => {
                const isActive = index === violationStep;
                return (
                  <View key={step.key} style={[styles.stepBadge, isActive && styles.stepBadgeActive]}>
                    <Text style={[styles.stepBadgeText, isActive && styles.stepBadgeTextActive]}>
                      {index + 1}. {step.title}
                    </Text>
                  </View>
                );
              })}
            </View>

            <ScrollView  contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {violationStep === 0 ? (
                <>
                  <Text style={styles.inputLabel}>Plate Number</Text>
                  <TextInput
                    value={violationForm.plateNumber || resolvedPlate}
                    editable={false}
                    style={[styles.inputField, styles.inputDisabled]}
                  />

                  <Text style={styles.inputLabel}>Violation Type</Text>
                  <Pressable
                    style={[styles.inputField, styles.selectField]}
                    onPress={() => setTypePickerVisible(true)}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        !violationForm.violationType && styles.selectPlaceholder,
                      ]}
                    >
                      {violationForm.violationType || "Select violation type"}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={colors.onyx} />
                  </Pressable>

                  {typesLoading ? (
                    <Text style={styles.helperText}>Loading violation types...</Text>
                  ) : null}
                  {typesError ? <Text style={styles.errorText}>{typesError}</Text> : null}

                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    value={violationForm.description}
                    onChangeText={(value) => setViolationField("description", value)}
            placeholder="Exceeded speed limit on Third Mainland Bridge"
            multiline
            numberOfLines={4}
            style={[styles.inputField, styles.multilineInput]}
            textAlignVertical="top"
            placeholderTextColor={colors.muted}
          />
                </>
              ) : null}

              {violationStep === 1 ? (
                <>
                  <Text style={styles.inputLabel}>Violation Date & Time</Text>
                  <TextInput
                    value={violationForm.violationDate}
                    onChangeText={(value) => setViolationField("violationDate", value)}
                    placeholder="2026-03-04T14:30:00"
                    autoCapitalize="none"
                    style={styles.inputField}
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    value={violationForm.state}
                    onChangeText={(value) => setViolationField("state", value)}
                    placeholder="Lagos"
                    style={styles.inputField}
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={styles.inputLabel}>LGA</Text>
                  <TextInput
                    value={violationForm.lga}
                    onChangeText={(value) => setViolationField("lga", value)}
                    placeholder="Ikeja"
                    style={styles.inputField}
                    placeholderTextColor={colors.muted}
                  />

                  <Text style={styles.inputLabel}>GPS Coordinates</Text>
                  <TextInput
                    value={violationForm.gpsCoordinates}
                    onChangeText={(value) => setViolationField("gpsCoordinates", value)}
                    placeholder="6.5244,3.3792"
                    autoCapitalize="none"
                    style={styles.inputField}
                    placeholderTextColor={colors.muted}
                  />
                </>
              ) : null}

              {violationStep === 2 ? (
                <>
                  <Text style={styles.inputLabel}>Fine Amount (NGN)</Text>
                  <TextInput
                    value={String(violationForm.fineAmount)}
                    placeholder="15000"
                    editable={false}
                    style={[styles.inputField, styles.inputDisabled]}
                    placeholderTextColor={colors.muted}
                  />

                  <View style={styles.reviewCard}>
                    <Text style={styles.reviewTitle}>Review</Text>
                    <Text style={styles.reviewLine}>Plate: {violationForm.plateNumber || resolvedPlate}</Text>
                    <Text style={styles.reviewLine}>Type: {violationForm.violationType || "N/A"}</Text>
                    <Text style={styles.reviewLine}>
                      Date: {normalizeViolationDate(violationForm.violationDate) || "N/A"}
                    </Text>
                    <Text style={styles.reviewLine}>
                      Location: {[violationForm.lga, violationForm.state].filter(Boolean).join(", ") || "N/A"}
                    </Text>
                    <Text style={styles.reviewLine}>
                      GPS: {violationForm.gpsCoordinates || "N/A"}
                    </Text>
                    <Text style={styles.reviewLine}>Fine: {violationForm.fineAmount || "N/A"}</Text>
                  </View>
                </>
              ) : null}

              {violationError ? <Text style={styles.errorText}>{violationError}</Text> : null}

              <View style={styles.stepActions}>
                {violationStep > 0 ? (
                  <Pressable
                    style={[styles.secondaryButton, styles.stepButton]}
                    onPress={() => setViolationStep((prev) => Math.max(prev - 1, 0))}
                  >
                    <Text style={styles.secondaryButtonText}>Back</Text>
                  </Pressable>
                ) : null}

                {violationStep < violationSteps.length - 1 ? (
                  <Pressable
                    style={[
                      styles.saveButton,
                      styles.stepButton,
                      (violationStep === 0 && !canContinueStep1) ||
                      (violationStep === 1 && !canContinueStep2)
                        ? styles.actionButtonDisabled
                        : null,
                    ]}
                    onPress={() => setViolationStep((prev) => Math.min(prev + 1, violationSteps.length - 1))}
                    disabled={
                      (violationStep === 0 && !canContinueStep1) ||
                      (violationStep === 1 && !canContinueStep2)
                    }
                  >
                    <Text style={styles.saveButtonText}>Next</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={[
                      styles.saveButton,
                      styles.stepButton,
                      (!canSubmit || violationSubmitting) && styles.actionButtonDisabled,
                    ]}
                    onPress={submitViolation}
                    disabled={!canSubmit || violationSubmitting}
                  >
                    <Text style={styles.saveButtonText}>
                      {violationSubmitting ? "Submitting..." : "Submit Violation"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={typePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypePickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Violation Type</Text>
              <Pressable onPress={() => setTypePickerVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.onyx} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.pickerContent} showsVerticalScrollIndicator={false}>
              {violationTypes.map((item) => (
                <Pressable
                  key={item.type}
                  style={styles.pickerItem}
                  onPress={() => selectViolationType(item)}
                >
                  <View>
                    <Text style={styles.pickerTitle}>{item.type}</Text>
                    <Text style={styles.pickerSubtitle}>Fine: {item.fineAmount}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.onyx} />
                </Pressable>
              ))}
              {!violationTypes.length && !typesLoading ? (
                <Text style={styles.stateText}>No violation types available.</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 16,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    ...shadows.lift,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.onyx,
    fontFamily: fonts.display,
  },
  subtitle: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  inputRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softViolet,
    paddingHorizontal: 12,
    color: colors.onyx,
    fontWeight: "600",
    backgroundColor: colors.whiteSmoke,
    fontFamily: fonts.body,
  },
  actionButton: {
    minWidth: 92,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.coral,
    paddingHorizontal: 14,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  cameraHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  stateText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    fontFamily: fonts.body,
  },
  permissionButton: {
    alignSelf: "flex-start",
    borderRadius: 12,
    backgroundColor: colors.violet,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  permissionButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: fonts.body,
  },
  cameraFrame: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.softViolet,
    height: 260,
    backgroundColor: colors.onyx,
    overflow: "hidden",
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    width: "100%",
    height: 260,
    borderRadius: 12,
    resizeMode: "cover",
  },
  cameraActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
  },
  captureButton: {
    borderRadius: 12,
    backgroundColor: colors.coral,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  captureButtonText: {
    color: colors.onyx,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: fonts.body,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softViolet,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: colors.whiteSmoke,
  },
  secondaryButtonText: {
    color: colors.violet,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: fonts.body,
  },
  flipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.softViolet,
    borderRadius: 10,
    backgroundColor: colors.whiteSmoke,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  flipText: {
    color: colors.violet,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  detectedText: {
    marginTop: 10,
    color: colors.violet,
    fontWeight: "700",
    fontSize: 13,
    fontFamily: fonts.body,
  },
  errorCard: {
    width: "100%",
    marginBottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.softCoral,
    borderWidth: 1,
    borderColor: colors.coral,
  },
  errorText: {
    color: colors.violet,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
  successCard: {
    width: "100%",
    marginBottom: 12,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colors.whiteSmoke,
    borderWidth: 1,
    borderColor: colors.softOnyx,
  },
  successText: {
    color: colors.violet,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 17, 8, 0.55)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    maxHeight: "88%",
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.softOnyx,
    backgroundColor: colors.whiteSmoke,
  },
  modalTitle: {
    color: colors.onyx,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: fonts.display,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: 16,
    paddingBottom: 24,
    height: "100%",
    gap: 8,
  },
  detailRow: {
    marginBottom: 6,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 2,
    fontFamily: fonts.body,
  },
  detailValue: {
    color: colors.onyx,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
  divider: {
    height: 1,
    backgroundColor: colors.softOnyx,
    marginVertical: 8,
  },
  saveButton: {
    marginTop: 12,
    alignSelf: "flex-end",
    borderRadius: 12,
    backgroundColor: colors.violet,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: fonts.body,
  },
  stepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.softOnyx,
    backgroundColor: colors.whiteSmoke,
  },
  stepBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.whiteSmoke,
    borderWidth: 1,
    borderColor: colors.softViolet,
  },
  stepBadgeActive: {
    backgroundColor: colors.violet,
  },
  stepBadgeText: {
    color: colors.onyx,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  stepBadgeTextActive: {
    color: colors.white,
  },
  inputLabel: {
    color: colors.onyx,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  inputField: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.softViolet,
    paddingHorizontal: 12,
    color: colors.onyx,
    fontWeight: "600",
    backgroundColor: colors.whiteSmoke,
    marginBottom: 8,
    fontFamily: fonts.body,
  },
  inputDisabled: {
    backgroundColor: colors.fog,
    color: colors.muted,
  },
  selectField: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.body,
  },
  selectPlaceholder: {
    color: colors.muted,
  },
  multilineInput: {
    minHeight: 92,
    paddingVertical: 10,
  },
  reviewCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    backgroundColor: colors.whiteSmoke,
    marginTop: 4,
  },
  reviewTitle: {
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
    fontFamily: fonts.display,
  },
  reviewLine: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  stepActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  stepButton: {
    alignSelf: "auto",
    minWidth: 120,
    alignItems: "center",
  },
  pickerCard: {
    maxHeight: "80%",
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.softOnyx,
    overflow: "hidden",
  },
  pickerContent: {
    padding: 16,
    gap: 10,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.softViolet,
    backgroundColor: colors.whiteSmoke,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerTitle: {
    color: colors.onyx,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.body,
  },
  pickerSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    fontFamily: fonts.body,
  },
});
