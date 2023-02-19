import praw
import time


def main():

    while True:
        # given a subreddit and a search phrase, pull posts from the past ten minutes
        # matching that search phrase in the title
        subreddit_name = "learnpython"
        search_phrase = "pytest"
        submissions = get_posts(subreddit_name, search_phrase)
        print(submissions)
        time.sleep(60 * 10)


def get_posts(subreddit_name: str, search_phrase: str):
    reddit = praw.Reddit("bot")
    # print(reddit.client_id)
    subreddit = reddit.subreddit(subreddit_name)
    submissions = []
    for submission in subreddit.new(limit=10):
        if search_phrase.lower() in submission.title.lower():
            submissions.append(submission)
    return submissions


if __name__ == '__main__':
    main()
