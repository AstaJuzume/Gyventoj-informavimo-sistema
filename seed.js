window.GI_SEED = {
  "houses": [
    {
      "id": 1,
      "street": "Žirmūnų g.",
      "number": "68A",
      "city": "Vilnius",
      "apartments": 48,
      "active": true,
      "residents": [
        {
          "id": 101,
          "apt": "12",
          "name": "Aistė Petrauskienė",
          "phone": "+370 612 34567",
          "email": "aiste.p@example.lt"
        },
        {
          "id": 102,
          "apt": "18",
          "name": "Marius Vaitkus",
          "phone": "+370 686 12456",
          "email": "marius.v@example.lt"
        },
        {
          "id": 103,
          "apt": "31",
          "name": "Dalia Rimkienė",
          "phone": "+370 699 88712",
          "email": ""
        },
        {
          "id": "demo-104",
          "apt": "6",
          "name": "Ieva Norkutė",
          "phone": "+370 611 45218",
          "email": "ieva.n@example.lt"
        },
        {
          "id": "demo-105",
          "apt": "24",
          "name": "Paulius Jankauskas",
          "phone": "",
          "email": "paulius.j@example.lt"
        },
        {
          "id": "demo-106",
          "apt": "38",
          "name": "Daiva Stonienė",
          "phone": "+370 687 55204",
          "email": ""
        }
      ]
    },
    {
      "id": 2,
      "street": "Kalvarijų g.",
      "number": "125",
      "city": "Vilnius",
      "apartments": 36,
      "active": true,
      "residents": [
        {
          "id": 201,
          "apt": "4",
          "name": "Tomas Jakštas",
          "phone": "+370 612 99123",
          "email": "tomas.j@example.lt"
        },
        {
          "id": 202,
          "apt": "22",
          "name": "Inga Balčiūnaitė",
          "phone": "",
          "email": "inga.b@example.lt"
        },
        {
          "id": "demo-203",
          "apt": "9",
          "name": "Lina Kazlauskienė",
          "phone": "+370 612 48819",
          "email": "lina.k@example.lt"
        },
        {
          "id": "demo-204",
          "apt": "17",
          "name": "Saulius Petrauskas",
          "phone": "+370 688 11342",
          "email": ""
        }
      ]
    },
    {
      "id": 3,
      "street": "Savanorių pr.",
      "number": "206",
      "city": "Kaunas",
      "apartments": 64,
      "active": true,
      "residents": [
        {
          "id": 301,
          "apt": "7",
          "name": "Jolanta Petraitienė",
          "phone": "+370 623 77541",
          "email": "jolanta.p@example.lt"
        },
        {
          "id": 302,
          "apt": "41",
          "name": "Andrius Mockus",
          "phone": "+370 699 11778",
          "email": "andrius.m@example.lt"
        },
        {
          "id": "demo-303",
          "apt": "15",
          "name": "Rasa Vaitkutė",
          "phone": "",
          "email": "rasa.v@example.lt"
        },
        {
          "id": "demo-304",
          "apt": "28",
          "name": "Darius Tamulis",
          "phone": "+370 699 42118",
          "email": "darius.t@example.lt"
        },
        {
          "id": "demo-305",
          "apt": "53",
          "name": "Kristina Rimkutė",
          "phone": "+370 620 77321",
          "email": ""
        }
      ]
    },
    {
      "id": 4,
      "street": "A. Juozapavičiaus pr.",
      "number": "17",
      "city": "Kaunas",
      "apartments": 24,
      "active": false,
      "residents": [
        {
          "id": 401,
          "apt": "2",
          "name": "Rūta Alksnienė",
          "phone": "+370 612 10001",
          "email": "ruta.a@example.lt"
        }
      ]
    }
  ],
  "users": [
    {
      "id": 1,
      "name": "Aistė Kazlauskaitė",
      "email": "aiste@example.lt",
      "role": "admin",
      "houseIds": []
    },
    {
      "id": 2,
      "name": "Mantas Žukauskas",
      "email": "mantas@example.lt",
      "role": "employee",
      "houseIds": [
        1,
        2
      ]
    },
    {
      "id": 3,
      "name": "Eglė Janulytė",
      "email": "egle@example.lt",
      "role": "employee",
      "houseIds": [
        3,
        4
      ]
    }
  ],
  "history": [
    {
      "id": "demo-history-3",
      "date": "2026-09-11 08:45",
      "subject": "Karšto vandens tiekimo sutrikimas",
      "sms": "Informuojame, kad šiandien iki 14:00 galimi karšto vandens tiekimo sutrikimai. Atsiprašome už nepatogumus.",
      "emailText": "Gerbiami gyventojai,\n\nŠiandien iki 14:00 dėl avarinių darbų galimi karšto vandens tiekimo sutrikimai. Atsiprašome už laikinus nepatogumus.\n\nAdministracija",
      "text": "Informuojame, kad šiandien iki 14:00 galimi karšto vandens tiekimo sutrikimai. Atsiprašome už nepatogumus.",
      "recipients": [
        {
          "id": 101,
          "apt": "12",
          "name": "Aistė Petrauskienė",
          "phone": "+370 612 34567",
          "email": "aiste.p@example.lt",
          "houseId": 1,
          "address": "Žirmūnų g. 68A, Vilnius",
          "channels": [
            "sms",
            "email"
          ]
        },
        {
          "id": "demo-104",
          "apt": "6",
          "name": "Ieva Norkutė",
          "phone": "+370 611 45218",
          "email": "ieva.n@example.lt",
          "houseId": 1,
          "address": "Žirmūnų g. 68A, Vilnius",
          "channels": [
            "sms",
            "email"
          ]
        },
        {
          "id": 201,
          "apt": "4",
          "name": "Tomas Jakštas",
          "phone": "+370 612 99123",
          "email": "tomas.j@example.lt",
          "houseId": 2,
          "address": "Kalvarijų g. 125, Vilnius",
          "channels": [
            "sms",
            "email"
          ]
        },
        {
          "id": "demo-203",
          "apt": "9",
          "name": "Lina Kazlauskienė",
          "phone": "+370 612 48819",
          "email": "lina.k@example.lt",
          "houseId": 2,
          "address": "Kalvarijų g. 125, Vilnius",
          "channels": [
            "sms",
            "email"
          ]
        }
      ],
      "count": 4,
      "channel": "both",
      "sender": "Aistė Kazlauskaitė",
      "mode": "demo",
      "houseIds": [
        1,
        2
      ]
    },
    {
      "id": "demo-history-4",
      "date": "2026-09-07 12:20",
      "subject": "Bendrojo naudojimo patalpų patikra",
      "text": "Rugsėjo 9 d. nuo 10:00 bus atliekama bendrojo naudojimo patalpų techninė patikra.",
      "sms": "Rugsėjo 9 d. nuo 10:00 bus atliekama bendrojo naudojimo patalpų techninė patikra.",
      "recipients": [
        {
          "id": 301,
          "apt": "7",
          "name": "Jolanta Petraitienė",
          "phone": "+370 623 77541",
          "email": "jolanta.p@example.lt",
          "houseId": 3,
          "address": "Savanorių pr. 206, Kaunas",
          "channels": [
            "sms"
          ]
        },
        {
          "id": 302,
          "apt": "41",
          "name": "Andrius Mockus",
          "phone": "+370 699 11778",
          "email": "andrius.m@example.lt",
          "houseId": 3,
          "address": "Savanorių pr. 206, Kaunas",
          "channels": [
            "sms"
          ]
        },
        {
          "id": "demo-304",
          "apt": "28",
          "name": "Darius Tamulis",
          "phone": "+370 699 42118",
          "email": "darius.t@example.lt",
          "houseId": 3,
          "address": "Savanorių pr. 206, Kaunas",
          "channels": [
            "sms"
          ]
        }
      ],
      "count": 3,
      "channel": "sms",
      "sender": "Eglė Janulytė",
      "mode": "demo",
      "houseIds": [
        3
      ]
    },
    {
      "date": "2026-09-10 14:32",
      "subject": "Vandens tiekimo darbai",
      "text": "Rugsėjo 12 d. nuo 9:00 iki 12:00 bus laikinai sustabdytas vandens tiekimas.",
      "recipients": [
        {
          "id": 101,
          "apt": "12",
          "name": "Aistė Petrauskienė",
          "phone": "+370 612 34567",
          "email": "aiste.p@example.lt",
          "houseId": 1,
          "address": "Žirmūnų g. 68A",
          "channels": [
            "sms",
            "email"
          ]
        },
        {
          "id": 102,
          "apt": "18",
          "name": "Marius Vaitkus",
          "phone": "+370 686 12456",
          "email": "marius.v@example.lt",
          "houseId": 1,
          "address": "Žirmūnų g. 68A",
          "channels": [
            "sms",
            "email"
          ]
        },
        {
          "id": 103,
          "apt": "31",
          "name": "Dalia Rimkienė",
          "phone": "+370 699 88712",
          "email": "",
          "houseId": 1,
          "address": "Žirmūnų g. 68A",
          "channels": [
            "sms"
          ]
        }
      ],
      "count": 3,
      "channel": "both",
      "sender": "Aistė Kazlauskaitė",
      "id": "seed-0",
      "mode": "demo",
      "houseIds": [
        1
      ]
    },
    {
      "date": "2026-09-09 10:15",
      "subject": "Laiptinės valymas",
      "text": "Informuojame apie numatomus laiptinės valymo darbus.",
      "recipients": [
        {
          "id": 201,
          "apt": "4",
          "name": "Tomas Jakštas",
          "phone": "+370 612 99123",
          "email": "tomas.j@example.lt",
          "houseId": 2,
          "address": "Kalvarijų g. 125",
          "channels": [
            "email"
          ]
        },
        {
          "id": 202,
          "apt": "22",
          "name": "Inga Balčiūnaitė",
          "phone": "",
          "email": "inga.b@example.lt",
          "houseId": 2,
          "address": "Kalvarijų g. 125",
          "channels": [
            "email"
          ]
        }
      ],
      "count": 2,
      "channel": "email",
      "sender": "Mantas Žukauskas",
      "id": "seed-1",
      "mode": "demo",
      "houseIds": [
        2
      ]
    },
    {
      "date": "2026-09-05 16:08",
      "subject": "Šildymo sistemos patikra",
      "text": "Rugsėjo 8 d. bus atliekama šildymo sistemos patikra.",
      "recipients": [
        {
          "id": 301,
          "apt": "7",
          "name": "Jolanta Petraitienė",
          "phone": "+370 623 77541",
          "email": "jolanta.p@example.lt",
          "houseId": 3,
          "address": "Savanorių pr. 206",
          "channels": [
            "sms"
          ]
        },
        {
          "id": 302,
          "apt": "41",
          "name": "Andrius Mockus",
          "phone": "+370 699 11778",
          "email": "andrius.m@example.lt",
          "houseId": 3,
          "address": "Savanorių pr. 206",
          "channels": [
            "sms"
          ]
        }
      ],
      "count": 2,
      "channel": "sms",
      "sender": "Eglė Janulytė",
      "id": "seed-2",
      "mode": "demo",
      "houseIds": [
        3
      ]
    }
  ],
  "prototypeDataVersion": 3
};
