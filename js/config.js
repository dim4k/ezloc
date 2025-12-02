/**
 * CONFIGURATION FILE
 * 
 * This file contains the DEFAULT configuration for the website.
 * In production, these values are overridden by the content fetched from the CMS (PocketBase).
 * 
 * Use this file to define the structure and default content (placeholders).
 */

export const SITE_CONFIG = {
    general: {
        name: "Villa Paradiso",
        tagline: "Votre évasion de rêve en bord de mer",
        description:
            "Bienvenue à la Villa Paradiso. Une demeure d'exception pour 8 personnes, offrant une vue imprenable sur l'océan et tout le confort moderne pour des vacances inoubliables.",
        ctaLabel: "Réserver maintenant",
        bookingEmail: "contact@example.com",
        bookingPhone: "+33 6 00 00 00 00",
        contactName: "L'équipe Villa Paradiso",
        
        airbnbCalendarUrl: "", // Optional: Add your Airbnb iCal link here

        pricing: {
            cleaningFee: 80,
            defaultPrice: 200,
            periods: [
                { start: "07-01", end: "08-31", price: 300 },
                { start: "12-20", end: "01-05", price: 250 },
                { start: "05-01", end: "05-31", price: 180 }
            ]
        }
    },
    labels: {
        nav: {
            home: "Accueil",
            pricing: "Tarifs",
            location: "Accès",
            book: "Contact"
        },
        hero: {
            discover: "Visiter la villa",
            availability: "Voir les disponibilités"
        },
        features: {
            sectionTitle: "Le Logement",
            sectionSubtitle: "Prestations haut de gamme",
            viewPhotos: "Voir la galerie",
            learnMore: "Détails"
        },
        pricing: {
            title: "Tarifs & Réservation"
        },
        map: {
            title: "Localisation",
            subtitle: "Un emplacement privilégié",
            addressTitle: "Adresse",
            nearbyTitle: "À proximité",
            nearbyList: [
                "Plage à 5 min à pied",
                "Commerces à 10 min",
                "Aéroport à 45 min"
            ]
        },
        contact: {
            title: "Nous contacter",
            subtitle: "Une question ? Envie de réserver ?",
            form: {
                name: "Votre nom",
                email: "Votre email",
                arrival: "Arrivée",
                departure: "Départ",
                message: "Votre message",
                submit: "Envoyer"
            },
            phone: {
                title: "Par téléphone"
            },
            email: {
                title: "Par email"
            }
        },
        footer: {
            location: "Côte d'Azur, France",
            rights: "Tous droits réservés.",
            credits: "Site template"
        },
        modal: {
            details: "Détails",
            otherPhotos: "Plus de photos :",
            close: "Fermer"
        }
    },
    hero: {
        image: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop",
        title: "Villa Paradiso",
        subtitle: "Luxe, Calme et Volupté"
    },
    features: [
        {
            id: "house",
            title: "La Villa",
            shortDesc: "Architecture contemporaine",
            fullDesc: "Une villa d'architecte de 200m² alliant modernité et confort. Grandes baies vitrées, matériaux nobles et finitions soignées.",
            icon: "home",
            thumbnail: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop",
            gallery: [
                "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop"
            ]
        },
        {
            id: "living",
            title: "Le Salon",
            shortDesc: "Espace de vie ouvert",
            fullDesc: "Un vaste séjour de 60m² ouvert sur la terrasse. Canapés confortables, TV 4K, système audio et cheminée pour les soirées d'hiver.",
            icon: "sofa",
            thumbnail: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop",
            gallery: [
                "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop",
                "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=2070&auto=format&fit=crop"
            ]
        },
        {
            id: "kitchen",
            title: "La Cuisine",
            shortDesc: "Équipement professionnel",
            fullDesc: "Cuisine américaine entièrement équipée : piano de cuisson, frigo américain, cave à vin et îlot central pour cuisiner en toute convivialité.",
            icon: "chef-hat",
            thumbnail: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=2070&auto=format&fit=crop",
            gallery: [
                "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?q=80&w=2070&auto=format&fit=crop"
            ]
        },
        {
            id: "pool",
            title: "La Piscine",
            shortDesc: "Piscine à débordement",
            fullDesc: "Superbe piscine au sel de 12x5m, chauffée d'avril à octobre. Transats et parasols à disposition pour vos moments de détente.",
            icon: "waves",
            thumbnail: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop",
            gallery: [
                "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop"
            ]
        }
    ],
    island: {
        title: "La Région",
        subtitle: "Entre mer et montagne",
        activities: [
            {
                title: "Plages & Criques",
                description: "Découvrez les plus belles plages de la région, des grandes étendues de sable fin aux criques sauvages accessibles uniquement par le sentier côtier.",
                images: [
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
                ]
            },
            {
                title: "Randonnée",
                description: "Des kilomètres de sentiers balisés vous attendent pour découvrir la faune et la flore locale. Panoramas exceptionnels garantis.",
                images: [
                    "https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop"
                ]
            },
            {
                title: "Gastronomie",
                description: "Profitez des marchés locaux et des nombreux restaurants étoilés de la région pour découvrir les spécialités culinaires.",
                images: [
                    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop"
                ]
            },
            {
                title: "Culture & Patrimoine",
                description: "Visitez les musées, châteaux et sites historiques qui font la richesse de notre patrimoine régional.",
                images: [
                    "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=2070&auto=format&fit=crop"
                ]
            }
        ]
    },
    location: {
        lat: 43.7102, // Nice, France (Generic)
        lng: 7.2620,
        address: "123 Avenue de la Mer<br> 06000 Nice, France",
        mapZoom: 13
    },
    amenities: [
        "8 Personnes",
        "4 Chambres",
        "3 Salles de bain",
        "Piscine Chauffée",
        "Wifi Fibre",
        "Climatisation",
        "Parking Privé"
    ],
    pricing: {
        range: "De 1000€ à 3000€ la semaine",
        details: [
            "Location à la semaine du samedi au samedi",
            "Linge de maison inclus",
            "Ménage de fin de séjour inclus"
        ]
    }
};
