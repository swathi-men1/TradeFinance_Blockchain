from pydantic import BaseModel


class OrganizationCreate(BaseModel):
    name: str
    org_type: str


class OrganizationResponse(BaseModel):
    id: int
    name: str
    org_type: str

    class Config:
        orm_mode = True
