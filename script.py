import openai #pip install openai
from googleapiclient.discovery import build

openai.api_key = "apikey" #replace apikey with your openai api key

class GoogleChat():
    def __init__(self):
        self.service = build(
            "customsearch", "v1", developerKey="customsearch credentials" #https://console.cloud.google.com/apis/library/customsearch.googleapis.com
        )

    def _search(self, query):
        response = (
            self.service.cse()
            .list(
                q=query,
                cx="search engine id", #https://programmablesearchengine.google.com/controlpanel/all
            )
            .execute()
        )
        if 'items' in response:
            return response['items']
        else:
            raise ValueError('No results found for the query.')

    def _get_search_query(self, history, query):
        messages = [
            {
                "role": "system",
                "content": "You are an assistant that helps to convert text into a web search engine query. "
                           "You output only 1 query for the latest message and nothing else."
            }
        ]

        for message in history:
            messages.append({"role": "user", "content": message[0]})

        messages.append(
            {
                "role": "user",
                "content": f"Based on my previous messages, what is the most relevant web search query for the text below?\n\nText: {query}\n\nQuery:"
            }
        )

        search_query = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0,
        )['choices'][0]['message']['content']

        return search_query.strip("\"")

    def run_text(self, history, query):
        try:
            search_query = self._get_search_query(history, query)
            print("")

            messages = [
                {
                    "role": "system",
                    "content": "You are a search assistant that answers questions based on search results and "
                               "provides links to relevant parts of your answer. Please always put the links at the end of your respone in this format: [link title](link url)"
                }
            ]

            for message in history:
                messages.append({"role": "user", "content": message[0]})
                if message[1]:
                    messages.append({"role": "assistant", "content": message[1]})

            prompt = "Answer query using the information from the search results below: \n\n"
            results = self._search(search_query)
            for result in results:
                prompt += f"Link: {result['link']}\n"
                prompt += f"Title: {result['title']}\n"
                prompt += f"Content: {result['snippet']}\n\n"
            prompt += f"Query: {query}"
            messages.append({"role": "user", "content": prompt})


            response = openai.ChatCompletion.create(
                model="gpt-4", #you can change this to one of the other models in gpt-models.txt
                messages=messages,
                temperature=0.4,
            )['choices'][0]['message']['content']

            history.append((query, response))

            print(response)
            
            return history
        except ValueError as e:
            print(f"Error: {e}")
            return history

if __name__ == '__main__':
    bot = GoogleChat()
    history = []

    while True:
        query = input("")
        if query.lower() in ["exit", "quit"]:
            break
        history = bot.run_text(history, query)
