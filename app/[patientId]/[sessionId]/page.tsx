import React from 'react'

type Props = {
  params: Promise<{
    patientId: string
    sessionId: string
  }>
}

const SessionPage = async (props: Props) => {
  const { patientId, sessionId } = await props.params

  return (
    <div>SessionPage {patientId} {sessionId}</div>
  )
}

export default SessionPage