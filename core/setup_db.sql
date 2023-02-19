CREATE TABLE subreddit_search (
  id SERIAL PRIMARY KEY,
  subreddit VARCHAR(50) NOT NULL,
  search_term VARCHAR(255) NOT NULL
);
