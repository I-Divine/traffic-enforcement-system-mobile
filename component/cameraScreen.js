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
import { File } from "expo-file-system";

const API_TOKEN = process.env.EXPO_PUBLIC_PLATE_RECOGNIZER_API_TOKEN; // Replace with your actual API token

export default function CameraScreen() {
  const cameraRef = useRef(null);
  const [facing, setFacing] = useState("back");
  const [photo, setPhoto] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [plateData, setPlateData] = useState(null);
  const [error, setError] = useState(null);

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
      // Use the new File API to read as base64
      const file = new File(photoUri);
      const base64 = await file.base64();

      // Create form data
      const formData = new FormData();
      formData.append("upload", base64);
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
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });
      setPhoto(photo);
      console.log("Photo URI:", photo.uri);

      // Automatically send to plate recognizer API
      await recognizePlate(photo.uri);
    }
  };

  const switchCamera = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const retakePhoto = () => {
    setPhoto(null);
    setPlateData(null);
    setError(null);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
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
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

      <View style={styles.controls}>
        <TouchableOpacity style={styles.flipButton} onPress={switchCamera}>
          <Text style={styles.flipText}>Flip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
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
    color: "white",
    marginBottom: 20,
    fontSize: 16,
  },
  controls: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  flipButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 15,
    borderRadius: 10,
  },
  flipText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "black",
  },
  previewControls: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 0, 0, 0.3)",
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  errorText: {
    color: "white",
    fontSize: 14,
  },
  resultsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  resultsTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  plateResult: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  plateNumber: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  plateInfo: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  noPlatesText: {
    color: "white",
    fontSize: 16,
    fontStyle: "italic",
  },
});
