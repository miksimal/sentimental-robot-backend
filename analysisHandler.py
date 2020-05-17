import boto3

def analyser(event, context):
  comprehend = boto3.client("comprehend")
  return comprehend.detect_sentiment(Text = event, LanguageCode = "en")