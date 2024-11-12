import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { tarotCards } from "./Cards";

const tarodCardImg = `https://img.freepik.com/free-vector/hand-drawn-esoteric-pattern-design_23-2149346196.jpg?size=500&ext=jpg`;
const { width, height } = Dimensions.get("window");

const numberOfCards = 30;
const minSize = 120;
const tarotCardSize = {
  width: minSize,
  height: minSize * 1.67,
  borderRadius: 12,
};
const TWO_PI = 2 * Math.PI;
const theta = TWO_PI / numberOfCards;
const tarotCardSizeVisiblePercentage = 1.4;
const tarotCardSizeOnCircle =
  tarotCardSizeVisiblePercentage * tarotCardSize.width;
const circleRadius = Math.max(
  (tarotCardSizeOnCircle * numberOfCards) / TWO_PI,
  width
);
const circleCircumference = TWO_PI * circleRadius;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function TarotCard({ card, cardIndex, index, onFlip, imageUri, activeindex }) {
  const mounted = useSharedValue(0);
  const flipAnimation = useSharedValue(0); // For flipping animation

  useEffect(() => {
    mounted.value = withTiming(1, { duration: 900 });
  }, []);

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(
            mounted.value,
            [0, 1],
            [0, theta * cardIndex]
          )}rad`,
        },
        {
          translateY: interpolate(
            //responsible for raising the centred card
            index.value,
            [cardIndex - 1, cardIndex, cardIndex + 1],
            [0, -tarotCardSize.height / 1, 0],
            Extrapolation.CLAMP
          ),
        },
        {
          rotateY: `${flipAnimation.value}deg`, // Flipping on Y-axis
        },
      ],
    };
  });

  const flipCard = () => {
    // Start flip animation
    flipAnimation.value = withTiming(flipAnimation.value === 0 ? 180 : 0, {
      duration: 700,
    });
    // After flip animation completes, wait for 2 seconds before calling onFlip
    setTimeout(() => {
      onFlip(cardIndex); // Notify parent about flip after delay
    }, 1000); // 2000 ms delay
  };

  return (
    <Animated.View
      style={[
        {
          width: tarotCardSize.width,
          height: circleRadius * 2,
          position: "absolute",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        },
        cardStyle,
      ]}
      onTouchEnd={flipCard}
    >
      {flipAnimation.value === 0 ? (
        <Image
          source={{ uri: tarodCardImg }}
          style={styles.tarotCardBackImage}
        />
      ) : (
        <>
          <Image
            source={{ uri: imageUri }}
            style={styles.tarotCardFrontImage}
          />
        </>
      )}
    </Animated.View>
  );
}

import { withDecay, withDelay } from "react-native-reanimated";

// Inside TarotWheel component
const TarotWheel = ({ cards, onCardChange }) => {
  const distance = useSharedValue(0);
  const isPanActive = useSharedValue(false);

  // Angle derived from the current distance
  const angle = useDerivedValue(() => distance.value / circleCircumference);

  // Derived index for determining active card
  const interpolatedIndex = useDerivedValue(() => {
    const x = Math.abs((angle.value % TWO_PI) / theta);
    return angle.value < 0 ? x : numberOfCards - x;
  });
  const activeIndex = useDerivedValue(() =>
    Math.round(interpolatedIndex.value)
  );

  // Pan gesture handler
  const pan = Gesture.Pan()
    .onBegin(() => {
      isPanActive.value = true;
    })
    .onChange((ev) => {
      // Apply user drag to distance
      distance.value += ev.changeX * (circleCircumference / width);
    })
    .onEnd((ev) => {
      isPanActive.value = false;

      // Apply decay animation with slight delay for smooth stop
      distance.value = withDelay(
        100, // Delay in milliseconds
        withDecay({
          velocity: ev.velocityX * (circleCircumference / width),
          deceleration: 0.995, // Lower value means longer slow-down
        })
      );
    });

  // Apply animated rotation style
  const wheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}rad` }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.wheelContainer, wheelStyle]}>
        {cards.map((card, cardIndex) => (
          <TarotCard
            key={card.key}
            card={card}
            index={interpolatedIndex}
            cardIndex={cardIndex}
            name={card.name}
            activeindex={activeIndex}
            imageUri={card.imageUri}
            onFlip={onCardChange}
          />
        ))}
      </Animated.View>
    </GestureDetector>
  );
};

export function TarotCards() {
  const [selectedCards, setSelectedCards] = useState([]);
  const [activeCardName, setActiveCardName] = useState(null);
  const [wheelVisible, setWheelVisible] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState(""); // New state for speech
  const [wheelKey, setWheelKey] = useState(0);

  const handleFlip = (card) => {
    // Update the key to trigger remounting
    setWheelKey((prevKey) => prevKey + 1);
    console.log(card);
    return card;
  };

  const handleCardChange = (cardIndex) => {
    const card = tarotCards[cardIndex];

    if (selectedCards.length < 3 && !selectedCards.includes(card)) {
      setSelectedCards((prev) => [...prev, card]);

      if (selectedCards.length === 0) {
        setFeedbackMessage("You’ve picked your first card!");
        // handleFlip;
      } else if (selectedCards.length === 1) {
        setFeedbackMessage("Second card! Just one more to go!");
      } else if (selectedCards.length === 2) {
        setFeedbackMessage("All cards selected! Let’s see your fate.");
        setTimeout(() => {
          setWheelVisible(false);
        }, 1000); // Small delay before hiding the wheel
      }

      setActiveCardName(card.name);
    }
    return handleFlip(card);
  };

  const resetSelection = () => {
    setSelectedCards([]);
    setActiveCardName(null);
    setWheelVisible(true);
    setFeedbackMessage("");
  };
  useEffect(() => {
    console.log("This runs once after the component mounts");
    const resetwheel = () => {};

    return () => {
      console.log("Cleanup before component unmounts");
    };
  }, []); // Empty array means this only runs once

  return (
    <ImageBackground
      source={{
        uri: "https://imgs.search.brave.com/ZDHtOlpqIY7XjdYOedVlfC2AHlu7BzatCNSXQXpLeuQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/cHJlbWl1bS1waG90/by9jb25zdGVsbGF0/aW9ucy1uaWdodC1z/a3lfMTE3OTQ3NS0z/NTYxMi5qcGc_c2l6/ZT02MjYmZXh0PWpw/Zw",
      }}
      style={styles.container}
    >
      <StatusBar hidden />
      {wheelVisible ? (
        <>
          {feedbackMessage ? (
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          ) : null}
          <TarotWheel
            key={wheelKey} // Dynamically change key to remount TarotWheel
            cards={tarotCards}
            onFlip={(card) => console.log(card)}
            onCardChange={handleCardChange}
          />
        </>
      ) : (
        <View>
          <Text style={styles.finalMessage}>The Selected Cards are:</Text>

          <View style={styles.finalCardsContainer}>
            {selectedCards.map((card, index) => (
              <Animated.View
                key={index}
                style={[styles.finalCard, { transform: [{ scale: 1 }] }]}
              >
                <Image
                  source={{ uri: tarodCardImg }}
                  style={styles.tarotCardFrontImage}
                />
                <Text style={styles.tarotCardLabel}>{card.name}</Text>
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity onPress={resetSelection} style={styles.resetButton}>
            <Text style={styles.resetButtonText}>Select Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minWidth: "100%",
  },
  selectedCardText: {
    position: "absolute",
    top: 100,
    color: "white",
    fontWeight: "700",
  },
  tarotCardBackImage: {
    width: tarotCardSize.width,
    height: tarotCardSize.height,
    borderRadius: tarotCardSize.borderRadius,
    resizeMode: "cover",
    borderWidth: 4,
    borderColor: "gold",
  },
  wheelContainer: {
    width: circleRadius * 2,
    height: circleRadius * 2,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    top: height - tarotCardSize.height * 2,
  },
  tarotCardFrontImage: {
    width: tarotCardSize.width,
    height: tarotCardSize.height,
    borderRadius: tarotCardSize.borderRadius,
    resizeMode: "cover",
  },
  tarotCardLabel: {
    position: "absolute",
    bottom: 10,
    left: 10,
    color: "black",
    fontWeight: "700",
    fontSize: 24,
    backgroundColor: "white",
    flexWrap: "wrap",
    padding: 1,
    borderRadius: 10,
  },
  finalCardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  finalCard: {
    margin: 10,
    alignItems: "center",
  },
  feedbackText: {
    position: "absolute",
    top: 50,
    color: "yellow",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  finalMessage: {
    color: "white",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  resetButtonText: {
    color: "black",
    fontSize: 18,
    fontWeight: "700",
  },
});
