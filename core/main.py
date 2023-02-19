import praw
import time
from datetime import datetime, timezone
import psycopg2

import db_creds

SEARCH_WAIT_TIME = 60 * 1000


def main():

    while True:
        # Connect to the database
        print('opening database connection')
        conn = psycopg2.connect(host=db_creds.rds_endpoint, user=db_creds.rds_username,
                                password=db_creds.rds_password, database=db_creds.rds_database,
                                port=db_creds.rds_port)
        sql = "SELECT * FROM subreddit_search"
        # Open a cursor to execute SQL statements
        cur = conn.cursor()
        cur.execute(sql)
        results = cur.fetchall()

        for result in results:
            print(result)
            subreddit_name = result[1]
            print('subreddit_name', subreddit_name)
            search_phrase = result[2]
            print('search_phrase', search_phrase)
            submissions = get_posts(subreddit_name, search_phrase)
            print(submissions)
            for submission in submissions:
                print(submission.title)
        # Close the cursor and connection
        cur.close()
        conn.close()
        print('connection closed')
        time.sleep(SEARCH_WAIT_TIME)


def get_posts(subreddit_name: str, search_phrase: str):
    reddit = praw.Reddit("bot")
    subreddit = reddit.subreddit(subreddit_name)
    submissions = []
    for submission in subreddit.new(limit=30):
        now = datetime.now(timezone.utc)
        now_epoch = time.mktime(now.timetuple())
        if search_phrase.lower() in submission.title.lower() and int(now_epoch - submission.created_utc) < SEARCH_WAIT_TIME:
            submissions.append(submission)
    return submissions


if __name__ == '__main__':
    main()
