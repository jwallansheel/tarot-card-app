import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TarotCards } from "../components/TarotCard"; 

export default function Home() {
  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Tarot Card App</Text>
      <TarotCards />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    margin: 20,
  },
});
