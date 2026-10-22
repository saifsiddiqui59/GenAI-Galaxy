/**
 * Azure Speech adapter: OPTIONAL production fallback.
 * Requires a secure HTTPS backend issuing short-lived Speech authorization tokens.
 * The static site must NEVER receive Speech subscription secrets, only time-limited tokens.
 * Expected broker response: { token: string, region: string }.
 */
export async function startAzureTranscription({ brokerUrl, supabase, onTranscript, onError }) {
  if (!brokerUrl || !brokerUrl.startsWith('https://')) throw new Error('HTTPS speech token broker is required');
  const {data:{session}}=await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sign in before using Azure Speech');
  const response=await fetch(brokerUrl,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({purpose:'galaxy-interview-stt'})});
  if (!response.ok) throw new Error(`Speech broker refused token (${response.status})`);
  const {token,region}=await response.json();
  if (!token || !region) throw new Error('Invalid Speech token broker response');
  // Package version is fixed. For production, bundle and lock to npm instead of using a CDN.
  const sdk=await import('https://cdn.jsdelivr.net/npm/microsoft-cognitiveservices-speech-sdk@1.46.0/+esm');
  const config=sdk.SpeechConfig.fromAuthorizationToken(token,region);
  config.speechRecognitionLanguage='en-IN';
  const audio=sdk.AudioConfig.fromDefaultMicrophoneInput();
  const recognizer=new sdk.SpeechRecognizer(config,audio);
  recognizer.recognized=(_sender,event)=>{
    if(event.result.reason===sdk.ResultReason.RecognizedSpeech && event.result.text) onTranscript(event.result.text);
  };
  recognizer.canceled=(_sender,event)=>onError(event.errorDetails||'Azure Speech canceled');
  await new Promise((resolve,reject)=>recognizer.startContinuousRecognitionAsync(resolve,reject));
  return {
    stop:()=>new Promise(resolve=>recognizer.stopContinuousRecognitionAsync(()=>{recognizer.close();resolve()},()=>{recognizer.close();resolve()})),
    provider:'azure-speech'
  };
}
