require("dotenv").config();
const mongoose = require("mongoose");

const Gallery = require("../models/Gallery");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Prevent duplicates
    await Gallery.deleteMany({});

    const galleryData = [
      {
        title: "Meeting with Hon'ble Lok Sabha Speaker Mr. Om Birla",
        description: "A memorable interaction with Hon'ble Lok Sabha Speaker Mr. Om Birla.",
        image: "/image/mr om birla meet.png",
        featured: true,
      },
      {
        title: "Turkish Embassy Visit",
        description: "Educational visit to the Turkish Embassy.",
        image: "/image/turkish-embasy.png",
        featured: true,
      },
      {
        title: "Volunteers Teaching Students",
        description: "Dedicated volunteers conducting educational sessions.",
        image: "/image/teach.png",
        featured: true,
      },
      {
        title: "Book Distribution Drive",
        description: "Providing books and learning material to children.",
        image: "/image/book.png",
        featured: false,
      },
      {
        title: "Holi Celebration",
        description: "Children celebrating the festival of colours together.",
        image: "/image/holi.png",
        featured: false,
      },
      {
        title: "Tree Plantation Drive",
        description: "Community plantation drive promoting environmental awareness.",
        image: "/image/environment.png",
        featured: true,
      },
      {
        title: "Christmas Celebration",
        description: "Celebrating Christmas with children and volunteers.",
        image: "/image/christmas celebration.png",
        featured: false,
      },
      {
        title: "Menstrual Health Awareness",
        description: "Awareness session focused on menstrual hygiene and health.",
        image: "/image/menstrual health awareness.png",
        featured: true,
      },
      {
        title: "Magic Show",
        description: "Fun-filled entertainment session for children.",
        image: "/image/magic show.png",
        featured: false,
      },
      {
        title: "Painting Activity",
        description: "Creative painting workshop for students.",
        image: "/image/fun activity.png",
        featured: false,
      },
      {
        title: "Learning Together",
        description: "Students actively participating in classroom learning.",
        image: "/image/study.png",
        featured: false,
      },
      {
        title: "Dussehra Celebration",
        description: "Celebrating Dussehra with cultural activities.",
        image: "/image/dussehra.png",
        featured: false,
      },
      {
        title: "Yoga Session",
        description: "Promoting health and wellness through yoga.",
        image: "/image/yoga.png",
        featured: false,
      },
      {
        title: "Sports Camp",
        description: "Outdoor sports activities encouraging teamwork.",
        image: "/image/sport.png",
        featured: true,
      },
      {
        title: "Independence Day Celebration",
        description: "Patriotic celebration with students and volunteers.",
        image: "/image/independence day cel.png",
        featured: true,
      },
      {
        title: "ISKCON Team Visit",
        description: "Special visit by the ISKCON team to interact with children.",
        image: "/image/isckon people visit.png",
        featured: false,
      },
      {
        title: "Lok Sabha Visit",
        description: "Educational visit to the Parliament of India.",
        image: "/image/lok sabha visit (2).png",
        featured: true,
      },
      {
        title: "Guest Speaker Session",
        description: "Inspirational session by a motivational speaker.",
        image: "/image/motivation speaker session.png",
        featured: true,
      },
      {
        title: "Music Session",
        description: "Interactive music session with students.",
        image: "/image/music session.png",
        featured: false,
      },
    ];

    await Gallery.insertMany(galleryData);

    console.log(`🎉 Successfully inserted ${galleryData.length} gallery images`);

    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });