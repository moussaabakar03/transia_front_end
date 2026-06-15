/**
 * 1. DÉFINITION DES RÔLES UTILISATEURS (RBAC)
 */
export type UserRole = 'SUPER_ADMIN'|'ADMIN'| 'MANAGER' | 'ENQUETEUR';

export interface Utilisateur {
  id: string; // UUID de l'utilisateur
  username: string;
  email: string;
  role: UserRole;
  nom?: string;
  prenom?: string;
}

// GlobalCustomization

// logo
// primary_color
// secondary_color
// header_text
// footer_text

export interface GlobalCustomization {
  custom_logo?: string;           // URL de l'image personnalisée (optionnel)
  custom_primary_color?: string;   // Code hexadécimal de la couleur personnalisée (optionnel)
  custom_secondary_color?: string; // Code hexadécimal de la couleur secondaire (optionnel)
  custom_header_text?: string;    // Texte personnalisé pour l'en-tête (optionnel)
  custom_footer_text?: string;    // Texte personnalisé pour le pied de page (optionnel)
}

/**
 * 2. MODÈLE DU FORMULAIRE GLOBAL
 */
export interface Formulaire {
  id?: string;             // optionnel car généré par Django (UUID)
  title: string;           // <--- VÉRIFIE BIEN QUE C'EST "title" ET NON "name" !
  description?: string;     // optionnel
  created_by?: string;     // UUID de l'utilisateur créateur (optionnel pour la création, mais présent dans les réponses de l'API)
  created_at?: string;     // optionnel
  updated_at?: string;     // optionnel
  status?: string;         // optionnel, ex: 'brouillon', 'deploye', 'archive'
  personnalisation?: GlobalCustomization;
  
  require_auth: boolean; 
  
  questions?: Field[]; // Liste optionnelle des champs embarqués
}

/**
 * 3. LOGIQUE DE BRANCHEMENT DYNAMIQUE (Skip Logic)
 */
export interface SkipLogic {
  depends_on_field?: string | null; // UUID du champ parent dont dépend la condition
  value?: string;                   // La valeur attendue pour déclencher la logique
  then_hide?: boolean;              // true = cacher si la condition est vraie, false = afficher
}

/**
 * 4. OPTIONS SUPPLÉMENTAIRES DES CHAMPS
 */
export interface FieldOptions {
  choices?: string[];        // Liste des options pour les types 'choice' et 'multiple_choice'
  min?: number;              // Valeur minimale (pour les types 'number') ou longueur min (pour 'text')
  max?: number;              // Valeur maximale ou longueur max
  placeholder?: string;      // Texte d'aide affiché dans le champ
}

/**
 * 5. STRUCTURE D'UN CHAMP / QUESTION (Field)
 */
export interface Field {
  id?: string;               // UUID unique du champ généré par le backend d'Ali
  form: string;              // UUID du formulaire auquel ce champ est rattaché
  label: string;             // La question posée à l'utilisateur/enquêteur
  
  // Tous les types de saisie gérés sur le terrain à Valken's Consulting
  field_type: 'text' | 'textarea' | 'number' | 'date' | 'choice' | 'multiple_choice' | 'photo' | 'signature' | 'gps'| 'file';
  
  required: boolean;         // Indique si le champ est obligatoire ou non
  order: number;             // Positionnement numérique du champ pour le tri de l'affichage
  options: FieldOptions;     // Configuration optionnelle (choix multiples, bornes...)
  skip_logic: SkipLogic;     // Moteur de saut dynamique associé au champ
  
  value?: any;               // Variable tampon locale pour stocker la réponse saisie sur le terrain
}