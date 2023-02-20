from django.urls import path

from . import views

app_name = 'frontend'
urlpatterns = [
    # ex: /frontend/
    path('', views.index, name='index'),
    # ex: /frontend/5/
    path('<int:search_id>/', views.detail, name='detail'),
    # ex: /frontend/5/results/
    path('<int:search_id>/results/', views.results, name='results'),
    # ex: /frontend/5/update/
    path('<int:search_id>/update/', views.update, name='update'),
]
