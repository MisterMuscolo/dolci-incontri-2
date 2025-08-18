// ... (mantieni tutto il codice esistente fino alla parte dei pulsanti)

<div className="flex justify-center space-x-4 pt-4">
  {!session ? (
    <>
      <Link to="/auth?tab=login">
        <Button variant="outline">Accedi</Button>
      </Link>
      <Link to="/auth?tab=register">
        <Button>Registrati</Button>
      </Link>
    </>
  ) : (
    <Link to="/dashboard">
      <Button>La tua Dashboard</Button>
    </Link>
  )}
</div>

// ... (resto del codice esistente)