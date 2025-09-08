CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  referrer_id UUID;
  referrer_code_from_meta TEXT;
  edge_function_url TEXT := 'https://bpfhentkvaelbphqlfot.supabase.co/functions/v1/send-admin-new-user-email'; -- URL completo della Edge Function
  request_body JSONB;
  response_status INTEGER;
  response_body TEXT;
BEGIN
  -- Inserisci il nuovo profilo utente con un referral_code generato
  INSERT INTO public.profiles (id, email, credits, role, referral_code)
  VALUES (
    new.id, 
    new.email, 
    0, -- Crediti predefiniti
    'user', -- Ruolo predefinito
    gen_random_uuid() -- Genera un codice referral unico per il NUOVO utente
  );

  -- Controlla se un codice referral è stato fornito durante la registrazione
  referrer_code_from_meta := new.raw_user_meta_data ->> 'referrer_code';

  IF referrer_code_from_meta IS NOT NULL THEN
    -- Trova l'ID dell'utente che ha referenziato (referrer)
    SELECT id INTO referrer_id
    FROM public.profiles
    WHERE referral_code = referrer_code_from_meta;

    IF referrer_id IS NOT NULL THEN
      -- Assegna 50 crediti all'utente che ha referenziato
      UPDATE public.profiles
      SET credits = credits + 50
      WHERE id = referrer_id;

      -- Registra la transazione di credito per il referrer
      INSERT INTO public.credit_transactions (user_id, amount, type, package_name)
      VALUES (referrer_id, 50, 'referral_bonus', 'Bonus referral per nuovo utente');
    END IF;
  END IF;

  -- Inserisci una notifica per gli amministratori sulla nuova registrazione
  INSERT INTO public.admin_notifications (type, entity_id, message, user_id)
  VALUES (
    'new_user_signup',
    new.id, -- L'ID del nuovo utente come entity_id
    'Nuovo utente registrato: ' || new.email,
    NULL -- user_id è NULL per le notifiche admin
  );

  -- Invocare la Edge Function per inviare l'email agli amministratori
  request_body := jsonb_build_object('newUserEmail', new.email);

  SELECT status, content INTO response_status, response_body
  FROM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := request_body
  );

  IF response_status <> 200 THEN
    RAISE WARNING 'Failed to send admin new user email. Status: %, Body: %', response_status, response_body;
  END IF;

  RETURN new;
END;
$$;

-- Trigger the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();