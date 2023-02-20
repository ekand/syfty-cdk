from django.db import models


class Search(models.Model):
    subreddit = models.CharField(max_length=200)
    search_term = models.CharField(max_length=200, default="")
    email = models.EmailField(default="")

    def __str__(self):
        return self.subreddit + "," + self.search_term
