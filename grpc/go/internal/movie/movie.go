package movie

type Director struct {
	Name string `json:"name"`
}

type Producer struct {
	Name string `json:"name"`
}

type CastMember struct {
	ActorName     string `json:"actor_name"`
	CharacterName string `json:"character_name"`
	Role          string `json:"role"`
	Biography     string `json:"biography"`
}

type CrewMember struct {
	Name string `json:"name"`
	Role string `json:"role"`
}

type Movie struct {
	MovieID      string       `json:"movie_id"`
	Title        string       `json:"title"`
	ReleaseDate  string       `json:"release_date"`
	Genre        []string     `json:"genre"`
	Director     Director     `json:"director"`
	Producer     []Producer   `json:"producer"`
	Cast         []CastMember `json:"cast"`
	Crew         []CrewMember `json:"crew"`
	PlotSummary  string       `json:"plot_summary"`
	RatingsScore float32      `json:"ratings_score"`
}

type MovieResponse struct {
	Movies     []Movie `json:"movies"`
	MovieCount int     `json:"movie_count"`
}
