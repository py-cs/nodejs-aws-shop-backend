export const handler = async (event: any, _ctx: unknown, cb: Function) => {
  if (event.type !== "TOKEN") return cb(null, "Unauthorized");

  try {
    const { authorizationToken } = event;
    const [, token] = authorizationToken.split(" ");

    const [username, password] = Buffer.from(token, "base64")
      .toString()
      .split(":");

    const storedUserPassword = process.env[username];

    const effect =
      !storedUserPassword || storedUserPassword !== password ? "Deny" : "Allow";

    const policy = generatePolicy(token, event.methodArn, effect);

    return cb(null, policy);
  } catch (error: unknown) {
    return cb(
      null,
      `Unauthorized: ${
        error instanceof Error ? error.message : "unknown error"
      }`
    );
  }
};

function generatePolicy(principalId: string, resource: string, effect: string) {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}
