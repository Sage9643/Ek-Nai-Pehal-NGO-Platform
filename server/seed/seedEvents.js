require('dotenv').config();

const mongoose = require('mongoose');
const Event = require('../models/Event');

const events = [
  {
    title: 'Meeting Lok Sabha Speaker',
    description:
      'On the occasion of completing one year of NGO -Ek Nai Pehal , we got a chance to meet Shree Om Birla ji , speaker of Lok Sabha',
    image: '/image/mr om birla meet.png',
    date: new Date('2025-11-13T09:00:00.000Z'),
    category: 'Visit',
  },
  {
    title: 'Iskcon Temple Visits Ek Nai Pehal',
    description:
      'The Iskcon Temple team visited Ek Nai Pehal bringing positive spiritual guidance and values to young minds',
    image: '/image/isckon people visit.png',
    date: new Date('2025-07-01T15:00:00.000Z'),
    category: 'Community',
  },
  {
    title: 'Independence Day Celebration 2025',
    description:
      'Ek Nai Pehal celebrates India\'s Independence Day with flag hoisting, patriotic performances by student volunteers, and a pledge drive for education and social service across communities.',
    image: '/image/independence day cel.png',
    date: new Date('2025-08-15T08:00:00.000Z'),
    category: 'Celebration',
  },
  {
    title: 'Turkish Embassy Visit',
    description:
      "Ek Nai Pehal NGO Students were invited at Turkish Embassy (Delhi) on the special occasion of Children's day of Turkey",
    image: '/image/turkish-embasy.png',
    date: new Date('2026-04-23T10:00:00.000Z'),
    category: 'Visit',
  },
  {
    title: 'Guest Speaker Session-Mr Amiett Kumar (Manifestation Coach)',
    description:
      'An inspiring day at our NGO as Mr Amiett interacted with our students and filled them with positivity, confidence and the courage to dream bigger.',
    image: '/image/motivation speaker session.png',
    date: new Date('2026-05-24T14:00:00.000Z'),
    category: 'Education',
  },
  {
    title: 'Menstrual Health Awareness Session',
    description:
      'An interactive workshop by Gynaecologist Dr. Latika ,educating adolescent girls and their mothers about menstrual health, hygiene practices, myths, and the importance of health and dignity.',
    image: '/image/menstrual health awareness.png',
    date: new Date('2026-05-13T14:00:00.000Z'),
    category: 'Workshop',
  }
];

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');

    await Event.deleteMany({});
    console.log('Existing events cleared');

    const createdEvents = await Event.insertMany(events);
    console.log(`${createdEvents.length} events seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedEvents();
