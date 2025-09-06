// ... (codice precedente)

          <TabsContent value="login">
            {isResettingPassword ? (
              // ... (form di reset password)
              <div className="flex justify-center py-2">
                  <Turnstile 
                    siteKey="$$CLOUDFLARE_TURNSTILE_SITE_KEY$$" // Sostituisci con la tua Site Key
                    onSuccess={setTurnstileToken}
                    options={{
                      theme: 'light',
                    }}
                  />
                </div>
              // ... (resto del form)
            ) : (
              <form onSubmit={handleLogin} className="space-y-4 pt-6">
                {/* ... (campi email e password) */}
                <div className="flex justify-center py-2">
                  <Turnstile 
                    siteKey="$$CLOUDFLARE_TURNSTILE_SITE_KEY$$" // Sostituisci con la tua Site Key
                    onSuccess={setTurnstileToken}
                    options={{
                      theme: 'light',
                    }}
                  />
                </div>
                {/* ... (pulsante di login) */}
              </form>
            )}
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignUp} className="space-y-4 pt-6">
              {/* ... (campi email e password) */}
              <div className="flex justify-center py-2">
                <Turnstile 
                  siteKey="$$CLOUDFLARE_TURNSTILE_SITE_KEY$$" // Sostituisci con la tua Site Key
                  onSuccess={setTurnstileToken}
                  options={{
                    theme: 'light',
                  }}
                />
              </div>
              {/* ... (pulsante di registrazione) */}
            </form>
          </TabsContent>

// ... (codice successivo)