from django.conf.urls import url
from graphene_django.views import GraphQLView

from api_public.graphql_schema import schema as api_schema

graphql_view = GraphQLView.as_view(graphiql=True, schema=api_schema)
graphql_view.csrf_exempt = True  # @see django.views.decorators.csrf.csrf_exempt

urlpatterns = [
    url(r'^graphql', graphql_view),
]
