import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { colors, fonts, shadows } from "../app/theme";

const API_TOKEN = process.env.EXPO_PUBLIC_PLATE_RECOGNIZER_API_TOKEN; // Replace with your actual API token

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState("back");
  const [photo, setPhoto] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [plateData, setPlateData] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need camera permissions</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recognizePlate = async (photoUri) => {
    setLoading(true);
    setError(null);
    setPlateData(null);

    try {
      // Send the captured image file as multipart/form-data.
      const formData = new FormData();
      formData.append("upload", {
        uri: photoUri,
        name: `plate-${Date.now()}.jpg`,
        type: "image/jpeg",
      });
      // Optional: Add regions for better accuracy
      // formData.append("regions", "us-ca"); // Example: California
      // formData.append("mmc", "true"); // Enable vehicle make/model/color

      const response = await fetch(
        "https://api.platerecognizer.com/v1/plate-reader/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${API_TOKEN}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || `Request failed with status ${response.status}`
        );
      }

      setPlateData(data);
      console.log("Plate Recognition Result:", data);
    } catch (err) {
      console.error("Plate Recognition Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      const capturedPhoto = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });
      setPhoto(capturedPhoto);
      console.log("Photo URI:", capturedPhoto.uri);

      // Automatically send to plate recognizer API
      await recognizePlate(capturedPhoto.uri);
    } catch (captureError) {
      console.error("Camera capture error:", captureError);
      setError("Failed to take photo. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  const switchCamera = () => {
    setIsCameraReady(false);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const retakePhoto = () => {
    setPhoto(null);
    setPlateData(null);
    setError(null);
    setIsCameraReady(false);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.loadingText}>Analyzing plate...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error: {error}</Text>
            </View>
          )}

          {plateData && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Results:</Text>

              {plateData.results && plateData.results.length > 0 ? (
                plateData.results.map((result, index) => (
                  <View key={index} style={styles.plateResult}>
                    <Text style={styles.plateNumber}>
                      Plate: {result.plate}
                    </Text>
                    <Text style={styles.plateInfo}>
                      Confidence: {(result.score * 100).toFixed(1)}%
                    </Text>
                    {result.region && (
                      <Text style={styles.plateInfo}>
                        Region: {result.region.code.toUpperCase()} (
                        {(result.region.score * 100).toFixed(1)}%)
                      </Text>
                    )}
                    {result.vehicle && (
                      <Text style={styles.plateInfo}>
                        Vehicle: {result.vehicle.type}
                      </Text>
                    )}
                    {result.model_make && result.model_make.length > 0 && (
                      <Text style={styles.plateInfo}>
                        Make/Model: {result.model_make[0].make}{" "}
                        {result.model_make[0].model}
                      </Text>
                    )}
                    {result.color && result.color.length > 0 && (
                      <Text style={styles.plateInfo}>
                        Color: {result.color[0].color}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noPlatesText}>No plates detected</Text>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.button} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Take Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setIsCameraReady(true)}
      />

      <View style={styles.controls}>
        <TouchableOpacity style={styles.flipButton} onPress={switchCamera}>
          <Text style={styles.flipText}>Flip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[
            styles.captureButton,
            (!isCameraReady || isCapturing) && styles.captureButtonDisabled,
          ]}
          onPress={takePhoto}
          disabled={!isCameraReady || isCapturing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onyx,
  },
  scrollView: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  preview: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    marginTop: 20,
  },
  message: {
    textAlign: "center",
    color: colors.white,
    marginBottom: 20,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  controls: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  flipButton: {
    backgroundColor: "rgba(242, 244, 243, 0.2)",
    padding: 15,
    borderRadius: 10,
  },
  flipText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: fonts.body,
  },
  bottomControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lift,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.onyx,
  },
  previewControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    backgroundColor: colors.coral,
    padding: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.onyx,
    fontFamily: fonts.body,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    color: colors.white,
    marginTop: 10,
    fontSize: 16,
    fontFamily: fonts.body,
  },
  errorContainer: {
    backgroundColor: colors.softCoral,
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  errorText: {
    color: colors.violet,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  resultsContainer: {
    backgroundColor: "rgba(7, 17, 8, 0.8)",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  resultsTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    fontFamily: fonts.display,
  },
  plateResult: {
    backgroundColor: "rgba(242, 244, 243, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  plateNumber: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    fontFamily: fonts.display,
  },
  plateInfo: {
    color: colors.whiteSmoke,
    fontSize: 14,
    marginBottom: 5,
    fontFamily: fonts.body,
  },
  noPlatesText: {
    color: colors.whiteSmoke,
    fontSize: 16,
    fontStyle: "italic",
    fontFamily: fonts.body,
  },
});
